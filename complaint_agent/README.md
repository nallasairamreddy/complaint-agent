# Autonomous Customer Complaint Prioritization Agent

A PARL (Perception, Action, Reasoning, Learning) agentic system that automatically ingests, classifies, prioritizes, routes, and learns from customer complaints.

---

## Project Structure

```
complaint_agent/
├── main.py            # FastAPI app & all API endpoints
├── database.py        # SQLite models, seeding, DB session
├── schemas.py         # Pydantic request/response models
├── perception.py      # VADER sentiment + spaCy keyword extraction
├── reasoning.py       # LangChain + LLM classification & utility scoring
├── action.py          # heapq-based priority queue & routing
├── learning.py        # Feedback-driven keyword & threshold updates
├── config.py          # Environment variable loading
├── requirements.txt   # All dependencies
└── .env.example       # Environment variable template
```

---

## Setup Instructions

### 1. Create & activate a virtual environment
```bash
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Download NLP models
```bash
python -m nltk.downloader vader_lexicon
python -m spacy download en_core_web_sm
```

### 4. Configure environment variables
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 5. Run the server
```bash
uvicorn main:app --reload --port 8000
```

### 6. Open API docs
Visit: http://localhost:8000/docs

---

## API Endpoints

| Method | Endpoint                          | Description                        |
|--------|-----------------------------------|------------------------------------|
| POST   | `/complaints/`                    | Submit a new complaint (runs PARL) |
| GET    | `/complaints/`                    | List all complaints                |
| GET    | `/complaints/{id}`                | Get a specific complaint           |
| POST   | `/complaints/{id}/resolve`        | Mark complaint as resolved         |
| POST   | `/feedback/`                      | Submit operator feedback (learning)|
| GET    | `/queue/`                         | View current priority queue        |
| GET    | `/queue/next`                     | Pop next highest-priority item     |

---

## Example Usage

### Submit a complaint
```bash
curl -X POST http://localhost:8000/complaints/ \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUST001",
    "text": "There was an unauthorized charge on my account. This is fraud and I need an immediate refund!"
  }'
```

### Submit operator feedback
```bash
curl -X POST http://localhost:8000/feedback/ \
  -H "Content-Type: application/json" \
  -d '{
    "complaint_id": 1,
    "new_priority": "Critical",
    "new_department": "Security",
    "escalation_reason": "Account breach detected"
  }'
```

---

## PARL Flow

```
Complaint Text
     ↓
[PERCEPTION]   VADER → sentiment score (-1 to +1)
               spaCy → risk keyword extraction from DB
     ↓
[REASONING]    LangChain LLM → department + severity classification
               Utility score = 0.6×(keyword weights) + 0.4×(sentiment urgency)
               DB thresholds → maps score to Low / Medium / High / Critical
     ↓
[ACTION]       Stored in SQLite DB
               Pushed into heapq priority queue (Critical=0, High=1, Medium=2, Low=3)
               Routed to appropriate department
     ↓
[LEARNING]     Operator feedback → boosts keyword weights in DB
               Adjusts urgency thresholds for better future accuracy
               All changes appended to complaint trace_log
```

---

## Priority Levels & Utility Score Thresholds

| Priority | Min Utility Score |
|----------|------------------|
| Critical | ≥ 0.75           |
| High     | ≥ 0.50           |
| Medium   | ≥ 0.25           |
| Low      | ≥ 0.00           |

Thresholds are stored in the database and adjust automatically through learning.
