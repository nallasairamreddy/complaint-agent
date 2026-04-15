from sqlalchemy.orm import Session
from database import KeywordWeight, UrgencyThreshold, Complaint
import spacy

nlp = spacy.load("en_core_web_sm")


def update_from_feedback(
    complaint_id: int,
    new_priority: str,
    new_department: str,
    escalation_reason: str,
    db: Session,
):
    """
    When an operator corrects a complaint, this function:
    1. Updates the complaint record
    2. Extracts keywords from escalation reason and boosts their weights
    3. Adjusts urgency thresholds if needed
    """
    # 1. Update complaint record
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        return {"error": "Complaint not found"}

    old_priority = complaint.priority
    complaint.priority = new_priority
    complaint.department = new_department
    complaint.status = "Escalated"
    complaint.trace_log += (
        f"\n[LEARNING] Operator escalated from {old_priority} → {new_priority}. "
        f"Reason: {escalation_reason}"
    )

    # 2. Extract keywords from reason and boost weights
    if escalation_reason:
        doc = nlp(escalation_reason.lower())
        new_keywords = [
            t.lemma_ for t in doc
            if not t.is_stop and not t.is_punct and t.is_alpha
        ]
        for kw in new_keywords:
            existing = db.query(KeywordWeight).filter_by(keyword=kw).first()
            if existing:
                existing.weight = min(existing.weight * 1.1, 3.0)  # boost, cap at 3.0
            else:
                db.add(KeywordWeight(keyword=kw, weight=1.2))

    # 3. Tighten thresholds if complaint was under-prioritized
    priority_order = ["Low", "Medium", "High", "Critical"]
    if priority_order.index(new_priority) > priority_order.index(old_priority):
        threshold = db.query(UrgencyThreshold).filter_by(
            priority_level=old_priority
        ).first()
        if threshold:
            threshold.min_utility_score = max(
                threshold.min_utility_score - 0.02, 0.0
            )

    db.commit()
    return {"status": "Learning update applied", "complaint_id": complaint_id}
