import database
from models import User, SecurityEvent, SecurityEventMLFeature
from incident_models import Incident, IncidentNote
def populate():
    db = database.SessionLocal()
    
    print("Adding users...")
    users = [
        {"username": "admin", "email": "admin@soc.local", "role": "ADMIN", "password": "password123"},
        {"username": "analyst1", "email": "analyst1@soc.local", "role": "ANALYST", "password": "password123"},
        {"username": "viewer1", "email": "viewer@soc.local", "role": "VIEWER", "password": "password123"},
    ]
    for u in users:
        # Check if exists
        existing = db.query(User).filter(User.username == u["username"]).first()
        if not existing:
            new_user = User(
                username=u["username"],
                email=u["email"],
                role=u["role"],
                password_hash="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjIQqiRQYq" # hardcoded 'password'
            )
            db.add(new_user)
    
    print("Adding manual security event and ML feature...")
    new_event = SecurityEvent(
        dataset_source="manual",
        proto="tcp",
        service="http",
        state="FIN",
        spkts=15,
        dpkts=20,
        sbytes=1024,
        dbytes=4096,
        rate=50.0,
        sload=100.0,
        dload=400.0,
        sloss=0,
        dloss=0,
        is_ftp_login=0,
        ct_ftp_cmd=0,
        ct_flw_http_mthd=1,
        attack_cat="Exploits",
        label=1
    )
    db.add(new_event)
    db.flush() # To get ID

    new_ml = SecurityEventMLFeature(
        event_id=new_event.id,
        dur=0.5,
        sinpkt=0.1,
        dinpkt=0.1,
        sjit=0.0,
        djit=0.0,
        swin=255,
        stcpb=12345,
        dtcpb=67890,
        dwin=255,
        tcprtt=0.01,
        synack=0.005,
        ackdat=0.005,
        smean=68,
        dmean=204,
        trans_depth=1,
        response_body_len=2048,
        ct_srv_src=1,
        ct_state_ttl=1,
        ct_dst_ltm=1,
        ct_src_dport_ltm=1,
        ct_dst_sport_ltm=1,
        ct_dst_src_ltm=1,
        ct_src_ltm=1,
        ct_srv_dst=1,
        is_sm_ips_ports=0
    )
    db.add(new_ml)
    
    print("Adding manual incident and notes...")
    incident = Incident(
        threat_category="Targeted Exploits",
        protocol="tcp",
        service="http",
        severity="CRITICAL",
        status="Investigating",
        event_count=1
    )
    db.add(incident)
    db.flush()
    
    notes = [
        IncidentNote(incident_id=incident.id, content="Initial detection of unusual HTTP payload size.", author="system"),
        IncidentNote(incident_id=incident.id, content="Assigned to analyst1 for deep packet inspection.", author="admin"),
        IncidentNote(incident_id=incident.id, content="Confirmed exploit attempt. Blocking source IP.", author="analyst1")
    ]
    for n in notes:
        db.add(n)
        
    # Also add notes to some existing incidents if possible
    existing_incident = db.query(Incident).first()
    if existing_incident:
        db.add(IncidentNote(incident_id=existing_incident.id, content="Automated note: Continuous monitoring initiated.", author="system"))
        
    try:
        db.commit()
        print("Successfully added manual entries to all tables!")
    except Exception as e:
        db.rollback()
        print(f"Error saving data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    populate()
