from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, desc
from pydantic import BaseModel
from typing import Optional
from database import get_db
from fastapi import UploadFile, File
import io
try:
    import PyPDF2
except ImportError:
    pass
from models import SecurityEvent
from incident_models import Incident, IncidentNote

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


def _derive_severity(attack_cat: str) -> str:
    if attack_cat in ["Backdoor", "Shellcode", "Worms"]:
        return "CRITICAL"
    elif attack_cat in ["DoS", "Reconnaissance", "Exploits"]:
        return "HIGH"
    elif attack_cat in ["Generic", "Analysis", "Fuzzers"]:
        return "MEDIUM"
    return "LOW"


@router.get("")
def get_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns deterministic incident groupings based on (attack_cat, proto, service).
    Creates/updates incident records on first access if they don't exist yet.
    """
    # Check if incidents table has been populated
    existing_count = db.query(func.count(Incident.id)).scalar() or 0

    if existing_count == 0:
        # Generate incidents from actual data grouping
        groups = db.query(
            SecurityEvent.attack_cat,
            SecurityEvent.proto,
            SecurityEvent.service,
            func.count(SecurityEvent.id).label("event_count")
        ).filter(
            SecurityEvent.label == 1,
            SecurityEvent.attack_cat.isnot(None)
        ).group_by(
            SecurityEvent.attack_cat,
            SecurityEvent.proto,
            SecurityEvent.service
        ).having(func.count(SecurityEvent.id) >= 5).all()

        for g in groups:
            incident = Incident(
                threat_category=g.attack_cat,
                protocol=g.proto,
                service=g.service,
                severity=_derive_severity(g.attack_cat),
                status="Open",
                event_count=g.event_count,
            )
            db.add(incident)
        db.commit()

    # Query incidents with optional filters
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status)
    if severity:
        query = query.filter(Incident.severity == severity)

    incidents = query.options(selectinload(Incident.notes)).order_by(desc(Incident.event_count)).limit(100).all()

    return [
        {
            "id": inc.id,
            "threat_category": inc.threat_category,
            "protocol": inc.protocol,
            "service": inc.service,
            "severity": inc.severity,
            "status": inc.status,
            "event_count": inc.event_count,
            "created_at": inc.created_at.isoformat() if inc.created_at else None,
            "updated_at": inc.updated_at.isoformat() if inc.updated_at else None,
            "notes_count": len(inc.notes) if inc.notes else 0,
        }
        for inc in incidents
    ]


@router.get("/{incident_id}")
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Get related events
    related = db.query(SecurityEvent).filter(
        SecurityEvent.attack_cat == incident.threat_category,
        SecurityEvent.proto == incident.protocol,
        SecurityEvent.service == incident.service,
        SecurityEvent.label == 1,
    ).limit(50).all()

    events = []
    for e in related:
        events.append({
            "id": e.id,
            "threat_type": e.attack_cat,
            "protocol": e.proto,
            "service": e.service,
            "state": e.state,
            "packets": (e.spkts or 0) + (e.dpkts or 0),
            "bytes_transferred": (e.sbytes or 0) + (e.dbytes or 0),
        })

    notes = [
        {
            "id": n.id,
            "content": n.content,
            "author": n.author,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in (incident.notes or [])
    ]

    return {
        "id": incident.id,
        "threat_category": incident.threat_category,
        "protocol": incident.protocol,
        "service": incident.service,
        "severity": incident.severity,
        "status": incident.status,
        "event_count": incident.event_count,
        "created_at": incident.created_at.isoformat() if incident.created_at else None,
        "updated_at": incident.updated_at.isoformat() if incident.updated_at else None,
        "related_events": events,
        "notes": notes,
    }


class StatusUpdate(BaseModel):
    status: str  # Open, Investigating, Resolved


class IncidentCreate(BaseModel):
    threat_category: str
    protocol: Optional[str] = "-"
    service: Optional[str] = "-"
    severity: str
    event_count: Optional[int] = 1
    status: Optional[str] = "Open"


@router.post("")
def create_incident(body: IncidentCreate, db: Session = Depends(get_db)):
    incident = Incident(
        threat_category=body.threat_category,
        protocol=body.protocol,
        service=body.service,
        severity=body.severity,
        status=body.status,
        event_count=body.event_count,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


@router.post("/upload")
async def upload_incident_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    try:
        content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        # Super simple parser - look for keywords in text
        threat_cat = "PDF Upload"
        severity = "MEDIUM"
        
        lower_text = text.lower()
        if "ddos" in lower_text or "denial" in lower_text:
            threat_cat = "DoS"
            severity = "HIGH"
        elif "malware" in lower_text or "virus" in lower_text or "backdoor" in lower_text:
            threat_cat = "Backdoor"
            severity = "CRITICAL"
        elif "exploit" in lower_text:
            threat_cat = "Exploits"
            severity = "HIGH"
        
        incident = Incident(
            threat_category=threat_cat,
            protocol="-",
            service="-",
            severity=severity,
            status="Open",
            event_count=1,
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)
        
        # Add the extracted text as a note
        note = IncidentNote(
            incident_id=incident.id,
            content=f"Incident generated from PDF '{file.filename}'.\nExtracted content snippet:\n{text[:300]}...",
            author="System"
        )
        db.add(note)
        db.commit()
        
        return incident
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing PDF: {str(e)}")


@router.post("/{incident_id}/status")
def update_incident_status(incident_id: int, body: StatusUpdate, db: Session = Depends(get_db)):
    if body.status not in ["Open", "Investigating", "Resolved"]:
        raise HTTPException(status_code=400, detail="Status must be Open, Investigating, or Resolved")

    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = body.status
    db.commit()
    db.refresh(incident)
    return {"message": f"Incident {incident_id} status updated to {body.status}"}


class NoteCreate(BaseModel):
    content: str
    author: str = "Analyst"


@router.post("/{incident_id}/notes")
def add_incident_note(incident_id: int, body: NoteCreate, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    note = IncidentNote(
        incident_id=incident_id,
        content=body.content,
        author=body.author,
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return {
        "id": note.id,
        "content": note.content,
        "author": note.author,
        "created_at": note.created_at.isoformat() if note.created_at else None,
    }
