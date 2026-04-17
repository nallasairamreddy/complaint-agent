from sqlalchemy.orm import Session
from database import KeywordWeight, UrgencyThreshold, Complaint
import spacy

nlp = spacy.load("en_core_web_sm")

PRIORITY_ORDER = ["Low", "Medium", "High", "Critical"]


def update_from_feedback(
    complaint_id: int,
    new_priority: str,
    new_department: str,
    escalation_reason: str,
    db: Session,
):
    """
    Operator feedback handler.

    UPGRADE  (e.g. Low → High):
      - Boost keywords from the escalation REASON
      - Lower old_priority threshold (easier to reach next time)
      - Status → Escalated

    DOWNGRADE (e.g. Medium → Low):
      - Reduce weights of keywords in the COMPLAINT ITSELF
        (they were over-triggering the utility score)
      - Raise ALL thresholds above new_priority
        (so future similar complaints don't overshoot again)
      - Status → Resolved

    UNCHANGED:
      - Status → Resolved, no learning.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        return {"error": "Complaint not found"}

    old_priority = complaint.priority
    priority_changed = old_priority != new_priority
    complaint.department = new_department

    # ── No change: just resolve ───────────────────────────────────────────
    if not priority_changed:
        complaint.status = "Resolved"
        complaint.trace_log += (
            f"\n[FEEDBACK] Operator reviewed. Priority unchanged ({old_priority}). "
            f"Marked Resolved."
        )
        db.commit()
        return {
            "status": "Resolved",
            "complaint_id": complaint_id,
            "priority_changed": False,
        }

    idx_old = PRIORITY_ORDER.index(old_priority)
    idx_new = PRIORITY_ORDER.index(new_priority)
    is_upgrade   = idx_new > idx_old
    is_downgrade = idx_new < idx_old

    complaint.priority = new_priority
    complaint.trace_log += (
        f"\n[ESCALATION] Operator changed priority: {old_priority} -> {new_priority}. "
        f"Reason: {escalation_reason}"
    )

    if is_upgrade:
        # Boost keywords from escalation reason
        complaint.status = "Escalated"
        if escalation_reason:
            doc = nlp(escalation_reason.lower())
            reason_keywords = [
                t.lemma_ for t in doc
                if not t.is_stop and not t.is_punct and t.is_alpha
            ]
            for kw in reason_keywords:
                existing = db.query(KeywordWeight).filter_by(keyword=kw).first()
                if existing:
                    existing.weight = min(existing.weight * 1.1, 3.0)
                else:
                    db.add(KeywordWeight(keyword=kw, weight=1.2))

        # Lower old_priority threshold so similar complaints score higher next time
        threshold = db.query(UrgencyThreshold).filter_by(
            priority_level=old_priority
        ).first()
        if threshold:
            threshold.min_utility_score = max(threshold.min_utility_score - 0.02, 0.0)

    elif is_downgrade:
        # Reduce weights of keywords IN THE COMPLAINT (not the reason)
        # These keywords caused the over-scoring — reduce them.
        # Status = Escalated because operator corrected the priority (downgrade is still a correction)
        complaint.status = "Escalated"

        complaint_keywords = [
            kw.strip()
            for kw in complaint.risk_keywords.split(",")
            if kw.strip()
        ]
        for kw in complaint_keywords:
            existing = db.query(KeywordWeight).filter_by(keyword=kw).first()
            if existing:
                # Reduce 12% per correction, floor at 0.5
                existing.weight = round(max(existing.weight * 0.88, 0.5), 4)

        # Raise ALL thresholds above new_priority
        # e.g. Medium->Low: raises Medium, High, Critical
        # e.g. High->Medium: raises High, Critical
        levels_to_raise = PRIORITY_ORDER[idx_new + 1:]
        for level in levels_to_raise:
            threshold = db.query(UrgencyThreshold).filter_by(
                priority_level=level
            ).first()
            if threshold:
                threshold.min_utility_score = round(
                    min(threshold.min_utility_score + 0.02, 1.0), 4
                )

        complaint.trace_log += (
            f"\n[LEARNING] Downgrade: reduced weights for {complaint_keywords}. "
            f"Raised thresholds for {levels_to_raise}."
        )

    db.commit()
    return {
        "status": complaint.status,
        "complaint_id": complaint_id,
        "priority_changed": True,
        "priority_transition": f"{old_priority} -> {new_priority}",
    }