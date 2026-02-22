import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "PolicyGuard"
    # Provide defaults to simplify local setup if a user prefers it
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./policyguard.db")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
