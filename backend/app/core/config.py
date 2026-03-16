from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import EmailStr, AnyHttpUrl
from typing import Optional, List

class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "Training WebApp"
    
    # DB Settings
    DATABASE_URL: str
    
    # Auth Settings
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_CALLBACK_URL: str = "http://localhost:8000/api/auth/callback"
    ALLOWED_DOMAIN: str
    
    # Encryption Settings (Used for AES-256-GCM)
    ENCRYPTION_KEY: str = "change-me-to-a-32-byte-base64-string"
    
    # Session Settings (8 hours)
    SESSION_EXPIRE_SECONDS: int = 8 * 60 * 60

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
