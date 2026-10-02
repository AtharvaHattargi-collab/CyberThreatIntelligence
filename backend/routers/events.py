import csv
import os
import shutil
import pandas as pd
from io import StringIO
from fastapi import APIRouter, Depends, Query, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from database import get_db
from models import SecurityEvent, SecurityEventMLFeature

router = APIRouter(prefix="/api/events", tags=["events"])

def get_base_query(db: Session, threat_type: str = None, protocol: str = None, 
                   service: str = None, severity: str = None, 
                   is_anomaly: bool = None, search: str = None):
    query = db.query(SecurityEvent)
    
    if threat_type:
        query = query.filter(SecurityEvent.attack_cat == threat_type)
    if protocol:
        query = query.filter(SecurityEvent.proto == protocol)
    if service:
        query = query.filter(SecurityEvent.service == service)
    if is_anomaly is not None:
        query = query.filter(SecurityEvent.label == (1 if is_anomaly else 0))
    if search:
        query = query.filter(
            or_(
                SecurityEvent.attack_cat.ilike(f"%{search}%"),
                SecurityEvent.proto.ilike(f"%{search}%"),
                SecurityEvent.service.ilike(f"%{search}%")
            )
        )
    # Severity is derived, filtering on it requires some logic
    if severity:
        if severity == "LOW":
            query = query.filter(SecurityEvent.label == 0)
        elif severity == "MEDIUM":
            query = query.filter(SecurityEvent.attack_cat.in_(["Generic", "Analysis", "Fuzzers"]))
        elif severity == "HIGH":
            query = query.filter(SecurityEvent.attack_cat.in_(["DoS", "Reconnaissance", "Exploits"]))
        elif severity == "CRITICAL":
            query = query.filter(SecurityEvent.attack_cat.in_(["Backdoor", "Shellcode", "Worms"]))
            
    return query

@router.get("")
def get_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=1000),
    threat_type: Optional[str] = None,
    protocol: Optional[str] = None,
    service: Optional[str] = None,
    severity: Optional[str] = None,
    is_anomaly: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = get_base_query(db, threat_type, protocol, service, severity, is_anomaly, search)
    
    total_count = query.count()
    total_pages = (total_count + page_size - 1) // page_size
    
    events = query.offset((page - 1) * page_size).limit(page_size).all()
    
    # Calculate derived severity for response
    results = []
    for e in events:
        sev = "LOW"
        if e.label == 1:
            if e.attack_cat in ["Generic", "Analysis", "Fuzzers"]: sev = "MEDIUM"
            elif e.attack_cat in ["DoS", "Reconnaissance", "Exploits"]: sev = "HIGH"
            else: sev = "CRITICAL"
            
        results.append({
            "id": e.id,
            "dataset_source": e.dataset_source,
            "threat_type": e.attack_cat,
            "protocol": e.proto,
            "service": e.service,
            "state": e.state,
            "packets": (e.spkts or 0) + (e.dpkts or 0),
            "bytes_transferred": (e.sbytes or 0) + (e.dbytes or 0),
            "is_anomaly": bool(e.label),
            "severity": sev
        })
        
    return {
        "records": results,
        "total_count": total_count,
        "current_page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.get("/export")
def export_events(
    threat_type: Optional[str] = None,
    protocol: Optional[str] = None,
    service: Optional[str] = None,
    severity: Optional[str] = None,
    is_anomaly: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = get_base_query(db, threat_type, protocol, service, severity, is_anomaly, search)
    # Limit export to 10k max to avoid memory issues for now
    events = query.limit(10000).all()
    
    def generate():
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Threat", "Protocol", "Service", "State", "Packets", "Bytes", "Anomaly", "Severity"])
        
        for e in events:
            sev = "LOW"
            if e.label == 1:
                if e.attack_cat in ["Generic", "Analysis", "Fuzzers"]: sev = "MEDIUM"
                elif e.attack_cat in ["DoS", "Reconnaissance", "Exploits"]: sev = "HIGH"
                else: sev = "CRITICAL"
                
            writer.writerow([
                e.id,
                e.attack_cat or "Normal",
                e.proto,
                e.service,
                e.state,
                (e.spkts or 0) + (e.dpkts or 0),
                (e.sbytes or 0) + (e.dbytes or 0),
                "Yes" if e.label else "No",
                sev
            ])
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)

    return StreamingResponse(
        generate(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=security_events.csv"}
    )

@router.get("/{event_id}")
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(SecurityEvent).filter(SecurityEvent.id == event_id).first()
    if not event:
        return {"error": "Event not found"}
        
    # Manually query ml_features since relationship might be lazy loaded
    ml_feature = db.query(SecurityEventMLFeature).filter(SecurityEventMLFeature.event_id == event_id).first()
    
    sev = "LOW"
    if event.label == 1:
        if event.attack_cat in ["Generic", "Analysis", "Fuzzers"]: sev = "MEDIUM"
        elif event.attack_cat in ["DoS", "Reconnaissance", "Exploits"]: sev = "HIGH"
        else: sev = "CRITICAL"
            
    result = {
        "id": event.id,
        "dataset_source": event.dataset_source,
        "threat_type": event.attack_cat,
        "protocol": event.proto,
        "service": event.service,
        "state": event.state,
        "packets": (event.spkts or 0) + (event.dpkts or 0),
        "bytes_transferred": (event.sbytes or 0) + (event.dbytes or 0),
        "is_anomaly": bool(event.label),
        "severity": sev,
        "ml_features": {}
    }
    
    if ml_feature:
        # Dump all ml features to dict
        result["ml_features"] = {k: v for k, v in ml_feature.__dict__.items() if not k.startswith('_')}
        
    return result
