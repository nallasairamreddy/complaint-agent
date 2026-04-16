from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from sqlalchemy.orm import Session
from database import KeywordWeight, UrgencyThreshold
from config import XAI_API_KEY, GOOGLE_API_KEY, LLM_PROVIDER
import json
import time


# Cache LLM instance at module level — only created once
_llm_instance = None

def get_llm():
    global _llm_instance
    if _llm_instance is None:
        from langchain_google_genai import ChatGoogleGenerativeAI
        _llm_instance = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=GOOGLE_API_KEY,
            temperature=0,
        )
    return _llm_instance

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
    """Uses LangChain + LLM to classify department and severity. Retries on rate limit."""
    llm = get_llm()
    chain = CLASSIFICATION_PROMPT | llm | StrOutputParser()
    
    last_error = None
    for attempt in range(2):  
        try:
            raw = chain.invoke({
                "complaint_text": text,
                "sentiment_score": round(sentiment, 4),
                "risk_keywords": ", ".join(keywords) if keywords else "none",
            })
            clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            return json.loads(clean)

        except json.JSONDecodeError:
            # LLM responded but JSON was malformed — no point retrying
            break

        except Exception as e:
            last_error = str(e)
            if "429" in last_error or "quota" in last_error.lower() or "rate" in last_error.lower():
                wait = 10 * (attempt + 1)  # 10s, 20s, 30s
               # print(f"[WARN] Rate limit hit, waiting {wait}s before retry {attempt + 1}/3...")
                time.sleep(wait)
            else:
                break  # non-rate-limit error, don't retry

    # Fallback: use rule-based classification so the app still works
    print(f"[WARN] LLM unavailable ({last_error}), falling back to rule-based classification.")
    return _rule_based_fallback(sentiment, keywords)


def _rule_based_fallback(sentiment: float, keywords: list) -> dict:
    """Simple deterministic fallback when LLM is unavailable."""
    financial_kw = {"fraud", "scam", "billing", "charge", "refund", "overcharge", "unauthorized"}
    security_kw  = {"hack", "breach", "unauthorized", "password", "account"}
    technical_kw = {"error", "outage", "down", "broken", "bug", "crash"}

    kw_set = set(keywords)
    if kw_set & security_kw:
        department = "Security"
    elif kw_set & financial_kw:
        department = "Billing"
    elif kw_set & technical_kw:
        department = "Technical Support"
    else:
        department = "General"

    if sentiment < -0.6:
        severity = "high"
    elif sentiment < -0.2:
        severity = "medium"
    else:
        severity = "low"

    return {
        "department": department,
        "severity_label": severity,
        "reasoning": "Rule-based fallback used (LLM unavailable).",
    }


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