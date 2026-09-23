from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from database import get_db
from models import SecurityEvent
from routers.analytics import apply_filters

router = APIRouter(prefix="/api/monitor", tags=["monitor"])


@router.get("/recent")
def get_recent_events(
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
    threat_type: Optional[str] = Query(None),
    protocol: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    is_anomaly: Optional[int] = Query(None)
):
    """
    Returns the most recent security events for the threat monitor feed.
    Ordered by ID descending (most recently ingested first).
    """

    query = db.query(SecurityEvent)
    query = apply_filters(query, threat_type, protocol, service, severity, is_anomaly)
    
    events = query.order_by(desc(SecurityEvent.id)).offset(offset).limit(limit).all()

    results = []
    for e in events:
        sev = "MEDIUM"
        if e.attack_cat in ["DoS", "Reconnaissance", "Exploits"]:
            sev = "HIGH"
        elif e.attack_cat in ["Backdoor", "Shellcode", "Worms"]:
            sev = "CRITICAL"

        results.append({
            "id": e.id,
            "threat_type": e.attack_cat or "Unknown",
            "protocol": e.proto,
            "service": e.service,
            "state": e.state,
            "packets": (e.spkts or 0) + (e.dpkts or 0),
            "bytes_transferred": (e.sbytes or 0) + (e.dbytes or 0),
            "severity": sev,
        })

    return results


@router.get("/stats")
def get_monitor_stats(db: Session = Depends(get_db)):
    """
    Returns aggregate counts for the monitor dashboard.
    """
    from sqlalchemy import func

    total = db.query(func.count(SecurityEvent.id)).scalar() or 0
    threats = db.query(func.count(SecurityEvent.id)).filter(SecurityEvent.label == 1).scalar() or 0
    critical = db.query(func.count(SecurityEvent.id)).filter(
        SecurityEvent.attack_cat.in_(["Backdoor", "Shellcode", "Worms"])
    ).scalar() or 0

    return {
        "total_events": total,
        "threats_detected": threats,
        "critical_events": critical,
    }
