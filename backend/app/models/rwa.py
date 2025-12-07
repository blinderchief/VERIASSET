"""
Pydantic Schemas for RWA Assets
Request/Response models for the RWA API endpoints
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator
from app.db.models import AssetType, AssetStatus, VerificationStatus


# ==================== Base Schemas ====================

class BaseSchema(BaseModel):
    """Base schema with common config"""
    model_config = {"from_attributes": True}


# ==================== Asset Schemas ====================

class AssetCreate(BaseModel):
    """Schema for creating a new RWA asset"""
    name: str = Field(..., min_length=1, max_length=100, description="Asset name")
    symbol: str = Field(..., min_length=1, max_length=10, description="Asset symbol (e.g., CCR)")
    description: str = Field(..., min_length=10, max_length=5000, description="Asset description")
    asset_type: AssetType = Field(..., description="Type of real-world asset")
    
    # Supply and pricing
    total_supply: int = Field(default=10000, ge=1, description="Total supply of tokens")
    price_per_unit: float = Field(default=1.0, ge=0, description="Initial price per unit in QUBIC")
    
    # Optional metadata
    image_url: Optional[str] = Field(default=None, description="Asset image URL")
    document_urls: List[str] = Field(default_factory=list, description="Supporting document URLs")
    external_data_sources: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="External data sources for verification"
    )
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    
    @field_validator("symbol")
    @classmethod
    def validate_symbol(cls, v: str) -> str:
        return v.upper()


class AssetUpdate(BaseModel):
    """Schema for updating an RWA asset"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=10, max_length=5000)
    price_per_unit: Optional[float] = Field(None, ge=0)
    image_url: Optional[str] = None
    document_urls: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class AssetResponse(BaseSchema):
    """Schema for asset response"""
    id: str
    name: str
    symbol: str
    description: str
    asset_type: AssetType
    status: AssetStatus
    
    creator_id: str
    
    total_supply: int
    circulating_supply: int
    price_per_unit: float
    currency: str
    
    verification_score: float
    verification_hash: Optional[str]
    
    qubic_contract_address: Optional[str]
    qubic_asset_id: Optional[str]
    
    image_url: Optional[str]
    document_urls: List[str]
    metadata: Dict[str, Any]
    
    created_at: datetime
    updated_at: datetime


class AssetListResponse(BaseModel):
    """Schema for paginated asset list"""
    items: List[AssetResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class AssetDetailResponse(AssetResponse):
    """Schema for detailed asset response with verification info"""
    verification_data: Dict[str, Any]
    external_data_sources: List[Dict[str, Any]]


# ==================== Verification Schemas ====================

class VerificationRequest(BaseModel):
    """Schema for requesting AI verification"""
    asset_id: str = Field(..., description="Asset ID to verify")
    verification_type: str = Field(
        default="comprehensive",
        description="Type of verification: comprehensive, document, satellite, iot, api"
    )
    input_data: Dict[str, Any] = Field(..., description="Data to analyze for verification")
    additional_context: Optional[str] = Field(None, description="Additional context for AI")


class VerificationResponse(BaseSchema):
    """Schema for verification response"""
    id: str
    asset_id: str
    status: VerificationStatus
    verification_type: str
    
    input_hash: str
    
    ai_model: str
    confidence_score: float
    summary: Optional[str]
    issues: List[str]
    
    proof_hash: Optional[str]
    oracle_signature: Optional[str]
    
    processing_time_ms: int
    
    created_at: datetime


class AIVerificationResult(BaseModel):
    """Schema for AI verification result from Gemini"""
    verified: bool
    confidence: float
    summary: str
    scores: Dict[str, float]
    issues: List[str]
    recommendations: List[str]
    processing_time_ms: int
    input_hash: str
    model: str
    timestamp: str


# ==================== Filter/Query Schemas ====================

class AssetFilters(BaseModel):
    """Schema for asset filtering"""
    asset_type: Optional[AssetType] = None
    status: Optional[AssetStatus] = None
    min_price: Optional[float] = Field(None, ge=0)
    max_price: Optional[float] = Field(None, ge=0)
    min_verification_score: Optional[float] = Field(None, ge=0, le=100)
    creator_id: Optional[str] = None
    search: Optional[str] = Field(None, description="Search in name and description")


class PaginationParams(BaseModel):
    """Schema for pagination parameters"""
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: str = Field(default="created_at")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")
