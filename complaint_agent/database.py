from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String, index=True)
    text = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    sentiment_score = Column(Float, default=0.0)
    risk_keywords = Column(String, default="")
    utility_score = Column(Float, default=0.0)
    priority = Column(String, default="Low")        # Low, Medium, High, Critical
    department = Column(String, default="General")
    status = Column(String, default="Pending")      # Pending, Resolved, Escalated
    trace_log = Column(Text, default="")


class KeywordWeight(Base):
    __tablename__ = "keyword_weights"

    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, unique=True, index=True)
    weight = Column(Float, default=1.0)


class UrgencyThreshold(Base):
    __tablename__ = "urgency_thresholds"

    id = Column(Integer, primary_key=True)
    priority_level = Column(String, unique=True)
    min_utility_score = Column(Float)


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Seed default thresholds
    if db.query(UrgencyThreshold).count() == 0:
        defaults = [
            UrgencyThreshold(priority_level="Critical", min_utility_score=0.75),
            UrgencyThreshold(priority_level="High",     min_utility_score=0.50),
            UrgencyThreshold(priority_level="Medium",   min_utility_score=0.25),
            UrgencyThreshold(priority_level="Low",      min_utility_score=0.0),
        ]
        db.add_all(defaults)
        db.commit()

    # Seed default keyword weights
    default_keywords = {
        "fraud": 2.0, "scam": 2.0, "hack": 2.0, "unauthorized": 1.8,
        "billing": 1.5, "charge": 1.5, "refund": 1.4, "overcharge": 1.6,
        "broken": 1.2, "error": 1.1, "outage": 1.7, "down": 1.3,
        "urgent": 1.5, "immediately": 1.4, "emergency": 1.8,
    }
    for kw, wt in default_keywords.items():
        if not db.query(KeywordWeight).filter_by(keyword=kw).first():
            db.add(KeywordWeight(keyword=kw, weight=wt))
    db.commit()
    db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
