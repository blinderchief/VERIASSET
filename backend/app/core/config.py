"""
VeriAssets Backend Configuration Module
Centralized configuration management using Pydantic Settings
"""

from functools import lru_cache
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
import json


class Settings(BaseSettings):
    """Application settings with validation and environment variable support"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Application Settings
    app_env: str = Field(default="development", description="Application environment")
    app_debug: bool = Field(default=False, description="Debug mode")
    app_secret_key: str = Field(default="change-me-in-production", description="Secret key for JWT")
    app_host: str = Field(default="0.0.0.0", description="Application host")
    app_port: int = Field(default=8000, description="Application port")
    
    # Database (Neon)
    database_url: str = Field(
        default="postgresql+asyncpg://localhost/veriassets",
        description="Async database URL"
    )
    database_sync_url: Optional[str] = Field(
        default=None,
        description="Sync database URL for migrations"
    )
    
    # Clerk Authentication
    clerk_secret_key: str = Field(default="", description="Clerk secret key")
    clerk_publishable_key: str = Field(default="", description="Clerk publishable key")
    clerk_webhook_secret: str = Field(default="", description="Clerk webhook secret")
    clerk_jwt_issuer: str = Field(default="", description="Clerk JWT issuer URL")
    
    # Google Gemini AI
    gemini_api_key: str = Field(default="", description="Google Gemini API key")
    gemini_model: str = Field(default="gemini-1.5-flash", description="Gemini model to use")
    
    # Qubic Network
    qubic_rpc_url: str = Field(
        default="https://rpc.qubic.org",
        description="Qubic mainnet RPC URL"
    )
    qubic_testnet_rpc_url: str = Field(
        default="https://testnet-rpc.qubic.org",
        description="Qubic testnet RPC URL"
    )
    qubic_network: str = Field(default="testnet", description="Qubic network to use")
    qubic_contract_index: int = Field(default=1, description="Qubic contract index")
    
    # Redis
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL"
    )
    
    # AWS S3
    aws_access_key_id: str = Field(default="", description="AWS access key")
    aws_secret_access_key: str = Field(default="", description="AWS secret key")
    aws_s3_bucket: str = Field(default="veriassets-uploads", description="S3 bucket name")
    aws_region: str = Field(default="us-east-1", description="AWS region")
    
    # EasyConnect
    easyconnect_webhook_url: str = Field(default="", description="EasyConnect webhook URL")
    easyconnect_secret: str = Field(default="", description="EasyConnect secret")
    
    # CORS
    cors_origins: List[str] = Field(
        default=["http://localhost:3000"],
        description="Allowed CORS origins"
    )
    
    # Rate Limiting
    rate_limit_per_minute: int = Field(default=60, description="Rate limit per minute")
    
    # Logging
    log_level: str = Field(default="INFO", description="Logging level")
    
    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [origin.strip() for origin in v.split(",")]
        return v
    
    @property
    def is_production(self) -> bool:
        return self.app_env == "production"
    
    @property
    def is_development(self) -> bool:
        return self.app_env == "development"
    
    @property
    def active_qubic_rpc(self) -> str:
        """Get the active Qubic RPC URL based on network setting"""
        if self.qubic_network == "mainnet":
            return self.qubic_rpc_url
        return self.qubic_testnet_rpc_url


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Export settings instance for convenience
settings = get_settings()
