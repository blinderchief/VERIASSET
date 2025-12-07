"""
Pydantic Schemas for User Operations
"""

from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field, EmailStr


class BaseSchema(BaseModel):
    """Base schema with common config"""
    model_config = {"from_attributes": True}


# ==================== User Schemas ====================

class UserCreate(BaseModel):
    """Schema for creating a user from Clerk webhook"""
    clerk_id: str = Field(..., description="Clerk user ID")
    email: EmailStr = Field(..., description="User email")
    username: Optional[str] = Field(None, description="Username")
    full_name: Optional[str] = Field(None, description="Full name")
    avatar_url: Optional[str] = Field(None, description="Avatar URL")


class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None
    wallet_address: Optional[str] = None
    qubic_public_key: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class UserResponse(BaseSchema):
    """Schema for user response"""
    id: str
    clerk_id: str
    email: str
    username: Optional[str]
    full_name: Optional[str]
    avatar_url: Optional[str]
    wallet_address: Optional[str]
    qubic_public_key: Optional[str]
    is_verified: bool
    metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime


class UserProfileResponse(UserResponse):
    """Schema for user profile with stats"""
    assets_created: int
    total_trades: int
    total_volume: float
    verification_score: float


# Alias for API compatibility
UserProfile = UserResponse


class UserProfileUpdate(BaseModel):
    """Schema for updating user profile"""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None


class UserSettings(BaseModel):
    """Schema for user settings"""
    email_notifications: bool = True
    push_notifications: bool = True
    marketing_emails: bool = False
    language: str = "en"
    timezone: str = "UTC"


class UserSettingsUpdate(BaseModel):
    """Schema for updating user settings"""
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    marketing_emails: Optional[bool] = None
    language: Optional[str] = None
    timezone: Optional[str] = None


class UserStatsResponse(BaseModel):
    """Schema for user statistics"""
    total_assets: int
    total_trades: int
    total_volume: float
    portfolio_value: float
    pnl_24h: float
    pnl_percentage: float


# ==================== Wallet Schemas ====================

class WalletConnectRequest(BaseModel):
    """Schema for connecting a wallet"""
    wallet_address: str = Field(..., description="Wallet address to connect")
    signature: str = Field(..., description="Signature proving wallet ownership")
    message: str = Field(..., description="Message that was signed")


class QubicWalletConnectRequest(BaseModel):
    """Schema for connecting Qubic wallet"""
    qubic_public_key: str = Field(..., description="Qubic public key")
    signature: Optional[str] = Field(None, description="Optional signature")


# Alias for API compatibility
UserWalletConnect = QubicWalletConnectRequest


class UserWalletResponse(BaseModel):
    """Schema for user wallet response"""
    qubic_public_key: Optional[str]
    wallet_address: Optional[str]
    balance: float = 0.0
    connected: bool = False


class WalletBalanceResponse(BaseModel):
    """Schema for wallet balance response"""
    address: str
    balance: float
    currency: str = "QUBIC"
    assets: Dict[str, int]  # asset_id -> quantity


# ==================== Authentication Schemas ====================

class ClerkWebhookPayload(BaseModel):
    """Schema for Clerk webhook payload"""
    type: str
    data: Dict[str, Any]


class TokenResponse(BaseModel):
    """Schema for token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class CurrentUser(BaseModel):
    """Schema for current authenticated user"""
    id: str
    clerk_id: str
    email: str
    username: Optional[str]
    qubic_public_key: Optional[str]
    is_admin: bool
