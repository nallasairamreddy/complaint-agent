# Autonomous Customer Complaint Prioritization Agent

A PARL (Perception, Action, Reasoning, Learning) system that ingests, classifies, prioritizes, and routes customer complaints using NLP and an LLM.

---

## Setup

### 1. Clone & create virtual environment
```bash
python -m venv venv
venv\Scripts\activate           # Windows
```

### 2. Install backend dependencies
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
# Open .env and fill in your API keys
```

`.env` should contain:
```
GOOGLE_API_KEY=your_google_api_key
LLM_PROVIDER=gemini       
```

### 5. Install frontend dependencies
```bash
cd frontend
npm install
```

---

## Running the App

### Start the backend
```bash
uvicorn main:app --reload --port 8000
```
API docs available at: http://localhost:8000/docs

### Start the frontend
```bash
cd frontend
npm run dev
```
Frontend available at: http://localhost:5173

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/complaints/` | Submit a complaint |
| GET | `/complaints/` | List all complaints |
| GET | `/complaints/{id}` | Get a complaint |
| POST | `/complaints/{id}/resolve` | Mark as resolved |
| POST | `/feedback/` | Submit operator feedback |
| GET | `/queue/` | View priority queue |
| GET | `/queue/next` | Pop next complaint |

---

## PARL Pipeline

```
Complaint Text
    ↓ Perception   — VADER sentiment + spaCy keyword extraction
    ↓ Reasoning    — LLM classification + utility score
    ↓ Action       — Store in DB + enqueue by priority
    ↓ Learning     — Operator feedback updates keyword weights & thresholds
```
