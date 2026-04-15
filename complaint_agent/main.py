from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from database import init_db, get_db, Complaint
from schemas import ComplaintIn, ComplaintOut, FeedbackIn
from perception import compute_perception
from reasoning import run_reasoning
from action import complaint_queue
from learning import update_from_feedback

app = FastAPI(title="Complaint Prioritization Agent", version="1.0")


@app.on_event("startup")
def startup_event():
    init_db()
    print("✅ Database initialized.")


@app.post("/complaints/", response_model=ComplaintOut)
def submit_complaint(complaint_in: ComplaintIn, db: Session = Depends(get_db)):
    """Ingest a new complaint and run the full PARL pipeline."""

    # --- PERCEPTION ---
    perception = compute_perception(complaint_in.text, db)

    # --- REASONING ---
    reasoning = run_reasoning(
        text=complaint_in.text,
        sentiment=perception["sentiment_score"],
        keywords=perception["risk_keywords"],
        db=db,
    )

    # --- ACTION: Store in DB ---
    complaint = Complaint(
        customer_id=complaint_in.customer_id,
        text=complaint_in.text,
        timestamp=complaint_in.timestamp or datetime.utcnow(),
        sentiment_score=perception["sentiment_score"],
        risk_keywords=", ".join(perception["risk_keywords"]),
        utility_score=reasoning["utility_score"],
        priority=reasoning["priority"],
        department=reasoning["department"],
        status="Pending",
        trace_log=reasoning["trace_log"],
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    # --- ACTION: Enqueue in priority queue ---
    complaint_queue.push(
        complaint_id=complaint.id,
        priority=complaint.priority,
        data={"customer_id": complaint.customer_id, "department": complaint.department},
    )

    return complaint


@app.get("/complaints/", response_model=list[ComplaintOut])
def list_complaints(db: Session = Depends(get_db)):
    """List all complaints ordered by utility score (highest first)."""
    return db.query(Complaint).order_by(Complaint.utility_score.desc()).all()


@app.get("/complaints/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: int, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


@app.post("/complaints/{complaint_id}/resolve")
def resolve_complaint(complaint_id: int, db: Session = Depends(get_db)):
    """Mark a complaint as resolved."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    complaint.status = "Resolved"
    db.commit()
    return {"status": "Resolved", "complaint_id": complaint_id}


@app.post("/feedback/")
def submit_feedback(feedback: FeedbackIn, db: Session = Depends(get_db)):
    """Operator feedback triggers the learning pipeline."""
    result = update_from_feedback(
        complaint_id=feedback.complaint_id,
        new_priority=feedback.new_priority,
        new_department=feedback.new_department,
        escalation_reason=feedback.escalation_reason or "",
        db=db,
    )
    return result


@app.get("/queue/")
def view_queue():
    """View the current priority queue state."""
    items = complaint_queue.all_items()
    return [
        {
            "rank": i.priority_rank,
            "complaint_id": i.complaint_id,
            "data": i.data,
        }
        for i in items
    ]


@app.get("/queue/next")
def next_in_queue():
    """Pop the highest-priority complaint from the queue."""
    item = complaint_queue.pop()
    if not item:
        return {"message": "Queue is empty"}
    return {"complaint_id": item.complaint_id, "data": item.data}
