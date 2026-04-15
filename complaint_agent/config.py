from dotenv import load_dotenv
import os

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
XAI_API_KEY = os.getenv("XAI_API_KEY", "")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")
DATABASE_URL = "sqlite:///./complaints.db"