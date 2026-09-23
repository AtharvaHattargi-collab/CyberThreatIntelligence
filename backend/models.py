from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Index, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="VIEWER", nullable=False) # ADMIN, ANALYST, VIEWER
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True, index=True)
    dataset_source = Column(String(50), nullable=False) # 'training' or 'testing'
    
    # Core Dashboard Analytics Fields
    proto = Column(String(50))
    service = Column(String(50))
    state = Column(String(50))
    spkts = Column(Integer)
    dpkts = Column(Integer)
    sbytes = Column(BigInteger)
    dbytes = Column(BigInteger)
    rate = Column(Float)
    sload = Column(Float)
    dload = Column(Float)
    sloss = Column(Integer)
    dloss = Column(Integer)
    
    # App Indicators
    is_ftp_login = Column(Integer)
    ct_ftp_cmd = Column(Integer)
    ct_flw_http_mthd = Column(Integer)
    
    # Threat & Anomaly
    attack_cat = Column(String(100))
    label = Column(Integer, nullable=False)

    # Relationship to ML Features
    ml_features = relationship("SecurityEventMLFeature", back_populates="event", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index('ix_security_events_dataset_source', 'dataset_source'),
        Index('ix_security_events_proto', 'proto'),
        Index('ix_security_events_service', 'service'),
        Index('ix_security_events_attack_cat', 'attack_cat'),
        Index('ix_security_events_label', 'label'),
    )

class SecurityEventMLFeature(Base):
    __tablename__ = "security_event_ml_features"

    event_id = Column(Integer, ForeignKey('security_events.id'), primary_key=True)
    
    # Granular Network Statistics
    dur = Column(Float)
    sinpkt = Column(Float)
    dinpkt = Column(Float)
    sjit = Column(Float)
    djit = Column(Float)
    swin = Column(Integer)
    stcpb = Column(BigInteger)
    dtcpb = Column(BigInteger)
    dwin = Column(Integer)
    tcprtt = Column(Float)
    synack = Column(Float)
    ackdat = Column(Float)
    
    # Payload & Connection Trackers
    smean = Column(Integer)
    dmean = Column(Integer)
    trans_depth = Column(Integer)
    response_body_len = Column(BigInteger)
    ct_srv_src = Column(Integer)
    ct_state_ttl = Column(Integer)
    ct_dst_ltm = Column(Integer)
    ct_src_dport_ltm = Column(Integer)
    ct_dst_sport_ltm = Column(Integer)
    ct_dst_src_ltm = Column(Integer)
    ct_src_ltm = Column(Integer)
    ct_srv_dst = Column(Integer)
    is_sm_ips_ports = Column(Integer)

    event = relationship("SecurityEvent", back_populates="ml_features")
