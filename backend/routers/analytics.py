from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case
from typing import Optional
from database import get_db
from models import SecurityEvent

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

def apply_filters(query, threat_type: Optional[str] = None, protocol: Optional[str] = None, service: Optional[str] = None, severity: Optional[str] = None, is_anomaly: Optional[int] = None):
    if threat_type:
        query = query.filter(SecurityEvent.attack_cat == threat_type)
    if protocol:
        query = query.filter(SecurityEvent.proto == protocol)
    if service:
        query = query.filter(SecurityEvent.service == service)
    if is_anomaly is not None:
        query = query.filter(SecurityEvent.label == is_anomaly)
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

@router.get("/overview")
def get_overview(
    db: Session = Depends(get_db),
    threat_type: Optional[str] = Query(None),
    protocol: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    is_anomaly: Optional[int] = Query(None)
):
    base_query = db.query(SecurityEvent.id)
    base_query = apply_filters(base_query, threat_type, protocol, service, severity, is_anomaly)
    
    total_events = db.query(func.count(base_query.subquery().c.id)).scalar() or 0
    
    attacks_q = apply_filters(db.query(SecurityEvent.id).filter(SecurityEvent.label == 1), threat_type, protocol, service, severity, is_anomaly)
    total_attacks = db.query(func.count(attacks_q.subquery().c.id)).scalar() or 0
    
    normal_q = apply_filters(db.query(SecurityEvent.id).filter(SecurityEvent.label == 0), threat_type, protocol, service, severity, is_anomaly)
    total_normal = db.query(func.count(normal_q.subquery().c.id)).scalar() or 0
    
    attack_percentage = (total_attacks / total_events * 100) if total_events > 0 else 0
    
    traffic_q = apply_filters(db.query(SecurityEvent.sbytes, SecurityEvent.dbytes, SecurityEvent.spkts, SecurityEvent.dpkts), threat_type, protocol, service, severity, is_anomaly).subquery()
    traffic_stats = db.query(
        func.sum(traffic_q.c.sbytes + traffic_q.c.dbytes).label("total_bytes"),
        func.sum(traffic_q.c.spkts + traffic_q.c.dpkts).label("total_packets")
    ).first()
    
    unique_protocols = apply_filters(db.query(SecurityEvent.proto), threat_type, protocol, service, severity, is_anomaly).distinct().count()
    unique_services = apply_filters(db.query(SecurityEvent.service), threat_type, protocol, service, severity, is_anomaly).distinct().count()
    
    high_risk_q = apply_filters(db.query(SecurityEvent.id).filter(
        SecurityEvent.attack_cat.in_(["DoS", "Reconnaissance", "Exploits", "Backdoor", "Shellcode", "Worms"])
    ), threat_type, protocol, service, severity, is_anomaly)
    high_risk = db.query(func.count(high_risk_q.subquery().c.id)).scalar() or 0
    
    top_threat_q = apply_filters(db.query(SecurityEvent.attack_cat, func.count(SecurityEvent.id).label("count")), threat_type, protocol, service, severity, is_anomaly)\
        .filter(SecurityEvent.attack_cat.isnot(None))\
        .group_by(SecurityEvent.attack_cat)\
        .order_by(desc("count")).first()
    
    top_threat = top_threat_q.attack_cat if top_threat_q else "None"
        
    return {
        "total_events": total_events,
        "total_attacks": total_attacks,
        "total_normal": total_normal,
        "attack_percentage": round(attack_percentage, 2),
        "total_bytes": int(traffic_stats.total_bytes or 0),
        "total_packets": int(traffic_stats.total_packets or 0),
        "unique_protocols": unique_protocols,
        "unique_services": unique_services,
        "high_risk_events": high_risk,
        "top_threat": top_threat,
    }

@router.get("/threat-distribution")
def get_threat_distribution(
    db: Session = Depends(get_db),
    threat_type: Optional[str] = Query(None),
    protocol: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    is_anomaly: Optional[int] = Query(None)
):
    total_q = apply_filters(db.query(SecurityEvent.id).filter(SecurityEvent.attack_cat.isnot(None)), threat_type, protocol, service, severity, is_anomaly)
    total = db.query(func.count(total_q.subquery().c.id)).scalar() or 1
    
    dist = apply_filters(db.query(SecurityEvent.attack_cat.label("category"), func.count(SecurityEvent.id).label("count")), threat_type, protocol, service, severity, is_anomaly)\
        .filter(SecurityEvent.attack_cat.isnot(None))\
        .group_by(SecurityEvent.attack_cat)\
        .order_by(desc("count")).all()
        
    return [
        {
            "category": row.category,
            "count": row.count,
            "percentage": round((row.count / total) * 100, 2)
        } for row in dist
    ]

@router.get("/protocol-distribution")
def get_protocol_distribution(
    db: Session = Depends(get_db),
    threat_type: Optional[str] = Query(None),
    protocol: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    is_anomaly: Optional[int] = Query(None)
):
    total_q = apply_filters(db.query(SecurityEvent.id), threat_type, protocol, service, severity, is_anomaly)
    total = db.query(func.count(total_q.subquery().c.id)).scalar() or 1
    
    dist = apply_filters(db.query(SecurityEvent.proto.label("protocol"), func.count(SecurityEvent.id).label("count")), threat_type, protocol, service, severity, is_anomaly)\
        .group_by(SecurityEvent.proto)\
        .order_by(desc("count")).limit(10).all()
        
    return [
        {
            "protocol": row.protocol,
            "count": row.count,
            "percentage": round((row.count / total) * 100, 2)
        } for row in dist
    ]

@router.get("/service-distribution")
def get_service_distribution(
    db: Session = Depends(get_db),
    threat_type: Optional[str] = Query(None),
    protocol: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    is_anomaly: Optional[int] = Query(None)
):
    total_q = apply_filters(db.query(SecurityEvent.id), threat_type, protocol, service, severity, is_anomaly)
    total = db.query(func.count(total_q.subquery().c.id)).scalar() or 1
    
    dist = apply_filters(db.query(SecurityEvent.service.label("service"), func.count(SecurityEvent.id).label("count")), threat_type, protocol, service, severity, is_anomaly)\
        .group_by(SecurityEvent.service)\
        .order_by(desc("count")).limit(10).all()
        
    return [
        {
            "service": row.service,
            "count": row.count,
            "percentage": round((row.count / total) * 100, 2)
        } for row in dist
    ]

@router.get("/traffic")
def get_traffic_stats(db: Session = Depends(get_db)):
    stats = db.query(
        func.sum(SecurityEvent.sbytes + SecurityEvent.dbytes).label("total_bytes"),
        func.sum(SecurityEvent.sbytes).label("source_bytes"),
        func.sum(SecurityEvent.dbytes).label("destination_bytes"),
        func.sum(SecurityEvent.spkts + SecurityEvent.dpkts).label("total_packets"),
        func.avg(SecurityEvent.rate).label("average_rate"),
        func.avg(SecurityEvent.sload).label("average_source_load"),
        func.avg(SecurityEvent.dload).label("average_destination_load")
    ).first()
    
    from models import SecurityEventMLFeature
    avg_duration = db.query(func.avg(SecurityEventMLFeature.dur)).scalar() or 0
    
    return {
        "total_bytes": int(stats.total_bytes or 0),
        "source_bytes": int(stats.source_bytes or 0),
        "destination_bytes": int(stats.destination_bytes or 0),
        "total_packets": int(stats.total_packets or 0),
        "average_rate": float(stats.average_rate or 0),
        "average_duration": float(avg_duration),
        "average_source_load": float(stats.average_source_load or 0),
        "average_destination_load": float(stats.average_destination_load or 0)
    }

@router.get("/severity")
def get_severity_distribution(
    db: Session = Depends(get_db),
    threat_type: Optional[str] = Query(None),
    protocol: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    is_anomaly: Optional[int] = Query(None)
):
    categories = apply_filters(db.query(SecurityEvent.attack_cat, SecurityEvent.label, func.count(SecurityEvent.id).label("count")), threat_type, protocol, service, severity, is_anomaly)\
        .group_by(SecurityEvent.attack_cat, SecurityEvent.label).all()
        
    distribution = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    
    for row in categories:
        if row.label == 0:
            distribution["LOW"] += row.count
        elif row.attack_cat in ["Generic", "Analysis", "Fuzzers"]:
            distribution["MEDIUM"] += row.count
        elif row.attack_cat in ["DoS", "Reconnaissance", "Exploits"]:
            distribution["HIGH"] += row.count
        else:
            distribution["CRITICAL"] += row.count
            
    return [{"severity": k, "count": v} for k, v in distribution.items()]

@router.get("/trends")
def get_trends(db: Session = Depends(get_db)):
    return {
        "message": "The UNSW-NB15 dataset (parquet version) does not contain original chronological timestamps.",
        "fallback_available": True,
        "note": "Time-based trends are intentionally omitted to preserve data integrity."
    }

@router.get("/threat-protocol-matrix")
def get_threat_protocol_matrix(db: Session = Depends(get_db)):
    """
    Cross-tabulation of threat category × protocol.
    """
    rows = db.query(
        SecurityEvent.attack_cat,
        SecurityEvent.proto,
        func.count(SecurityEvent.id).label("count")
    ).filter(
        SecurityEvent.label == 1,
        SecurityEvent.attack_cat.isnot(None)
    ).group_by(
        SecurityEvent.attack_cat,
        SecurityEvent.proto
    ).order_by(desc("count")).all()

    return [
        {
            "threat": r.attack_cat,
            "protocol": r.proto,
            "count": r.count
        }
        for r in rows
    ]

@router.get("/attack-ranking")
def get_attack_ranking(db: Session = Depends(get_db)):
    """
    Ranked attack categories with aggregate packet/byte stats.
    """
    rows = db.query(
        SecurityEvent.attack_cat,
        func.count(SecurityEvent.id).label("event_count"),
        func.sum(SecurityEvent.spkts + SecurityEvent.dpkts).label("total_packets"),
        func.sum(SecurityEvent.sbytes + SecurityEvent.dbytes).label("total_bytes"),
        func.avg(SecurityEvent.rate).label("avg_rate"),
    ).filter(
        SecurityEvent.label == 1,
        SecurityEvent.attack_cat.isnot(None)
    ).group_by(SecurityEvent.attack_cat)\
     .order_by(desc("event_count")).all()

    return [
        {
            "category": r.attack_cat,
            "event_count": r.event_count,
            "total_packets": int(r.total_packets or 0),
            "total_bytes": int(r.total_bytes or 0),
            "avg_rate": round(float(r.avg_rate or 0), 2),
        }
        for r in rows
    ]
