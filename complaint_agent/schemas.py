from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ComplaintIn(BaseModel):
    customer_id: str
    text: str
    timestamp: Optional[datetime] = None


class ComplaintOut(BaseModel):
    id: int
    customer_id: str
    text: str
    sentiment_score: float
    risk_keywords: str
    utility_score: float
    priority: str
    department: str
    status: str
    trace_log: str

    class Config:
        from_attributes = True


class FeedbackIn(BaseModel):
    complaint_id: int
    new_priority: str
    new_department: str
    escalation_reason: Optional[str] = ""
