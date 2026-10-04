import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "AllergySafe Table API"
    VERSION: str = "1.0.0"
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
    HF_TOKEN: str = os.getenv("HF_TOKEN", "")
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()
