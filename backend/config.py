import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings:
    PORT: int = int(os.getenv("PORT", "3000"))
    DEBUG: bool = os.getenv("DEBUG", "0") in ("1", "true", "True")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "familist-secret-key-change-in-production-12345")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_DAYS: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS", "7"))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./familist.db")

    # SMTP (optional) - if not provided, emails will be logged
    SMTP_HOST: str | None = os.getenv("SMTP_HOST")
    SMTP_PORT: int | None = int(os.getenv("SMTP_PORT", "0")) if os.getenv("SMTP_PORT") else None
    SMTP_USER: str | None = os.getenv("SMTP_USER")
    SMTP_PASS: str | None = os.getenv("SMTP_PASS")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "no-reply@familist.local")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "FamiList")

    # SendGrid (optional). If provided, takes precedence over SMTP
    SENDGRID_API_KEY: str | None = os.getenv("SENDGRID_API_KEY")

settings = Settings()

