import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel

# Load secrets from backend/.env for local runs. Real environment variables
# (e.g. set in the Render dashboard) take precedence.
load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=False)

class Settings(BaseModel):
    PROJECT_NAME: str = "AllergySafe Table API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Open-Weight AI Models (Google Gemma 2 primary target for Featured Partner Category)
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "gemma2:2b")
    FALLBACK_MODELS: list[str] = ["gemma2:2b", "gemma2:9b", "gemma:2b", "llama3.2:3b", "qwen2.5:3b"]
    HF_TOKEN: str = os.getenv("HF_TOKEN", "")

    # Partner Integrations
    ELEVENLABS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY", "")
    ELEVENLABS_VOICE_ID: str = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM") # Rachel (friendly chef voice)
    ELEVENLABS_MODEL: str = os.getenv("ELEVENLABS_MODEL", "eleven_turbo_v2_5")
    SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")

    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.onrender.com",
        "*"
    ]

settings = Settings()

