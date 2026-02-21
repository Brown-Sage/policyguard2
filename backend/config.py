import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "PolicyGuard"
    # Provide defaults to simplify local setup if a user prefers it
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./policyguard.db")

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
