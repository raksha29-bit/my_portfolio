from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "Game Portfolio API"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = Field("postgresql://postgres:postgres@db:5432/portfolio", validation_alias="DATABASE_URL")
    
    # LLM Provider Layer configuration
    LLM_PROVIDER: str = Field("mock", validation_alias="LLM_PROVIDER")
    GEMINI_API_KEY: Optional[str] = Field(None, validation_alias="GEMINI_API_KEY")
    OPENAI_API_KEY: Optional[str] = Field(None, validation_alias="OPENAI_API_KEY")
    ANTHROPIC_API_KEY: Optional[str] = Field(None, validation_alias="ANTHROPIC_API_KEY")
    OLLAMA_HOST: str = Field("http://localhost:11434", validation_alias="OLLAMA_HOST")
    
    # CORS configurations
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env")

settings = Settings()
