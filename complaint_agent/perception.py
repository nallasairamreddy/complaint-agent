import spacy
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from sqlalchemy.orm import Session
from database import KeywordWeight

# Load models once at startup
vader = SentimentIntensityAnalyzer()
nlp = spacy.load("en_core_web_sm")


def analyze_sentiment(text: str) -> float:
    """Returns compound sentiment score from -1.0 (very negative) to +1.0 (very positive)."""
    scores = vader.polarity_scores(text)
    return scores["compound"]


def extract_risk_keywords(text: str, db: Session) -> list:
    """Extracts risk-related tokens from complaint text using spaCy + DB keyword list."""
    doc = nlp(text.lower())
    tokens = {token.lemma_ for token in doc if not token.is_stop and not token.is_punct}

    # Fetch all known risk keywords from DB
    known_keywords = {kw.keyword for kw in db.query(KeywordWeight).all()}
    matched = list(tokens & known_keywords)
    return matched


def compute_perception(text: str, db: Session) -> dict:
    """Full perception pipeline. Returns sentiment score and risk keywords."""
    sentiment = analyze_sentiment(text)
    keywords = extract_risk_keywords(text, db)
    return {
        "sentiment_score": sentiment,
        "risk_keywords": keywords,
    }
