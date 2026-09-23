from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    threat_category = Column(String(100), nullable=False)
    protocol = Column(String(50))
    service = Column(String(50))
    severity = Column(String(20), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(20), nullable=False, default="Open")  # Open, Investigating, Resolved
    event_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    notes = relationship("IncidentNote", back_populates="incident", cascade="all, delete-orphan", order_by="IncidentNote.created_at.desc()")


class IncidentNote(Base):
    __tablename__ = "incident_notes"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    content = Column(Text, nullable=False)
    author = Column(String(100), default="Analyst")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    incident = relationship("Incident", back_populates="notes")
