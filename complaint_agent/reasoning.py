from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_xai import ChatXAI
from sqlalchemy.orm import Session
from database import KeywordWeight, UrgencyThreshold
from dotenv import load_dotenv
import os
import json

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))


def get_llm():
    return ChatXAI(
        model="grok-3-mini",
        api_key=XAI_API_KEY,
        temperature=0,
    )


CLASSIFICATION_PROMPT = PromptTemplate(
    input_variables=["complaint_text", "sentiment_score", "risk_keywords"],
    template="""
You are a customer support triage AI. Analyze the following complaint and respond ONLY in valid JSON.

Complaint: {complaint_text}
Sentiment Score (VADER compound, -1 to +1): {sentiment_score}
Detected Risk Keywords: {risk_keywords}

Respond with exactly this JSON structure:
{{
  "department": "<Billing | Technical Support | Security | General>",
  "severity_label": "<low | medium | high | critical>",
  "reasoning": "<one sentence explanation>"
}}
"""
)


def classify_complaint(text: str, sentiment: float, keywords: list, db: Session) -> dict:
    """Uses LangChain + Grok to classify department and severity."""
    llm = get_llm()
    chain = CLASSIFICATION_PROMPT | llm | StrOutputParser()
    raw = chain.invoke({
        "complaint_text": text,
        "sentiment_score": round(sentiment, 4),
        "risk_keywords": ", ".join(keywords) if keywords else "none",
    })
    try:
        clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        result = json.loads(clean)
    except json.JSONDecodeError:
        result = {
            "department": "General",
            "severity_label": "low",
            "reasoning": "Could not parse LLM response.",
        }
    return result


def compute_utility_score(sentiment: float, keywords: list, db: Session) -> float:
    kw_map = {k.keyword: k.weight for k in db.query(KeywordWeight).all()}
    keyword_score = sum(kw_map.get(kw, 1.0) for kw in keywords)
    normalized_kw = min(keyword_score / 10.0, 1.0)
    sentiment_urgency = max(0.0, (-sentiment + 1) / 2)
    utility = 0.6 * normalized_kw + 0.4 * sentiment_urgency
    return round(utility, 4)


def map_priority(utility_score: float, db: Session) -> str:
    thresholds = db.query(UrgencyThreshold).order_by(
        UrgencyThreshold.min_utility_score.desc()
    ).all()
    for t in thresholds:
        if utility_score >= t.min_utility_score:
            return t.priority_level
    return "Low"


def run_reasoning(text: str, sentiment: float, keywords: list, db: Session) -> dict:
    llm_result = classify_complaint(text, sentiment, keywords, db)
    utility = compute_utility_score(sentiment, keywords, db)
    priority = map_priority(utility, db)

    trace = (
        f"[PERCEPTION] sentiment={sentiment}, keywords={keywords}\n"
        f"[LLM] department={llm_result['department']}, "
        f"severity={llm_result['severity_label']}, reason={llm_result['reasoning']}\n"
        f"[UTILITY] score={utility}\n"
        f"[DECISION] priority={priority}, routed_to={llm_result['department']}"
    )

    return {
        "department": llm_result["department"],
        "utility_score": utility,
        "priority": priority,
        "trace_log": trace,
    }