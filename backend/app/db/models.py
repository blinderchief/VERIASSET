"""
VeriAssets Database Models
SQLModel definitions for RWA assets, users, trades, and verifications
"""

from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from enum import Enum
import uuid


# Enums for asset types and statuses
class AssetType(str, Enum):
    CARBON_CREDIT = "carbon_credit"
    TREASURY = "treasury"
    REAL_ESTATE = "real_estate"
    COMMODITY = "commodity"
    INTELLECTUAL_PROPERTY = "intellectual_property"
    ART = "art"
    COLLECTIBLE = "collectible"
    OTHER = "other"


class AssetStatus(str, Enum):
    DRAFT = "draft"
    PENDING_VERIFICATION = "pending_verification"
    VERIFIED = "verified"
    REJECTED = "rejected"
    LISTED = "listed"
    SOLD_OUT = "sold_out"
    DELISTED = "delisted"


class VerificationStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    VERIFIED = "verified"
    FAILED = "failed"
    MANUAL_REVIEW = "manual_review"


class TradeStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ProposalStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    VOTING = "voting"
    APPROVED = "approved"
    REJECTED = "rejected"
    IPO_ACTIVE = "ipo_active"
    IPO_COMPLETED = "ipo_completed"


# Base model with common fields
class TimestampMixin(SQLModel):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# User model (synced with Clerk)
class User(TimestampMixin, table=True):
    __tablename__ = "users"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    clerk_id: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    username: Optional[str] = Field(default=None, index=True)
    full_name: Optional[str] = Field(default=None)
    avatar_url: Optional[str] = Field(default=None)
    wallet_address: Optional[str] = Field(default=None, index=True)
    qubic_public_key: Optional[str] = Field(default=None, index=True)
    is_verified: bool = Field(default=False)
    is_admin: bool = Field(default=False)
    user_metadata: dict = Field(default_factory=dict, sa_column=Column(JSON))
    
    # Relationships
    assets: List["RWAAsset"] = Relationship(back_populates="creator")
    trades: List["Trade"] = Relationship(back_populates="user")


# RWA Asset model
class RWAAsset(TimestampMixin, table=True):
    __tablename__ = "rwa_assets"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = Field(index=True)
    symbol: str = Field(max_length=10, index=True)
    description: str
    asset_type: AssetType = Field(index=True)
    status: AssetStatus = Field(default=AssetStatus.DRAFT, index=True)
    
    # Creator relationship
    creator_id: str = Field(foreign_key="users.id", index=True)
    creator: Optional[User] = Relationship(back_populates="assets")
    
    # Asset details
    total_supply: int = Field(default=0)
    circulating_supply: int = Field(default=0)
    price_per_unit: float = Field(default=0.0)
    currency: str = Field(default="QUBIC")
    
    # Verification details
    verification_score: float = Field(default=0.0)  # AI confidence score (0-100)
    verification_data: dict = Field(default_factory=dict, sa_column=Column(JSON))
    verification_hash: Optional[str] = Field(default=None)
    
    # Qubic integration
    qubic_contract_address: Optional[str] = Field(default=None, index=True)
    qubic_asset_id: Optional[str] = Field(default=None, index=True)
    qubic_tx_hash: Optional[str] = Field(default=None)
    
    # Asset metadata
    image_url: Optional[str] = Field(default=None)
    document_urls: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    external_data_sources: List[dict] = Field(default_factory=list, sa_column=Column(JSON))
    asset_metadata: dict = Field(default_factory=dict, sa_column=Column(JSON))
    
    # Relationships
    verifications: List["Verification"] = Relationship(back_populates="asset")
    trades: List["Trade"] = Relationship(back_populates="asset")
    proposal: Optional["NostromoProposal"] = Relationship(back_populates="asset")


# AI Verification model
class Verification(TimestampMixin, table=True):
    __tablename__ = "verifications"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    asset_id: str = Field(foreign_key="rwa_assets.id", index=True)
    asset: Optional[RWAAsset] = Relationship(back_populates="verifications")
    
    status: VerificationStatus = Field(default=VerificationStatus.PENDING, index=True)
    verification_type: str = Field(index=True)  # satellite, iot, document, api
    
    # Input data
    input_data: dict = Field(default_factory=dict, sa_column=Column(JSON))
    input_hash: str
    
    # AI analysis results
    ai_model: str = Field(default="gemini-1.5-flash")
    ai_response: dict = Field(default_factory=dict, sa_column=Column(JSON))
    confidence_score: float = Field(default=0.0)
    summary: Optional[str] = Field(default=None)
    issues: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    
    # Proof generation
    proof_hash: Optional[str] = Field(default=None)
    oracle_signature: Optional[str] = Field(default=None)
    
    # Metadata
    processing_time_ms: int = Field(default=0)
    error_message: Optional[str] = Field(default=None)


# Trade model
class Trade(TimestampMixin, table=True):
    __tablename__ = "trades"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    asset_id: str = Field(foreign_key="rwa_assets.id", index=True)
    asset: Optional[RWAAsset] = Relationship(back_populates="trades")
    user_id: str = Field(foreign_key="users.id", index=True)
    user: Optional[User] = Relationship(back_populates="trades")
    
    trade_type: str = Field(index=True)  # buy, sell
    status: TradeStatus = Field(default=TradeStatus.PENDING, index=True)
    
    quantity: int
    price_per_unit: float
    total_amount: float
    fee_amount: float = Field(default=0.0)
    fee_burned: float = Field(default=0.0)  # 0.3% burned as per PRD
    
    # Qubic transaction details
    qubic_tx_hash: Optional[str] = Field(default=None, index=True)
    qubic_tick: Optional[int] = Field(default=None)
    
    # Settlement
    settled_at: Optional[datetime] = Field(default=None)
    settlement_data: dict = Field(default_factory=dict, sa_column=Column(JSON))


# Nostromo Proposal model
class NostromoProposal(TimestampMixin, table=True):
    __tablename__ = "nostromo_proposals"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    asset_id: str = Field(foreign_key="rwa_assets.id", unique=True, index=True)
    asset: Optional[RWAAsset] = Relationship(back_populates="proposal")
    
    status: ProposalStatus = Field(default=ProposalStatus.DRAFT, index=True)
    
    # Proposal details
    title: str
    description: str
    pitch_deck_url: Optional[str] = Field(default=None)
    
    # Voting details
    votes_for: int = Field(default=0)
    votes_against: int = Field(default=0)
    quorum_required: int = Field(default=451)  # 451/676 computors
    voting_deadline: Optional[datetime] = Field(default=None)
    
    # IPO details (Dutch auction)
    ipo_start_price: Optional[float] = Field(default=None)
    ipo_end_price: Optional[float] = Field(default=None)
    ipo_total_shares: Optional[int] = Field(default=None)
    ipo_shares_sold: int = Field(default=0)
    ipo_start_time: Optional[datetime] = Field(default=None)
    ipo_end_time: Optional[datetime] = Field(default=None)
    
    # Results
    final_price: Optional[float] = Field(default=None)
    total_raised: float = Field(default=0.0)
    
    # Qubic integration
    qubic_proposal_id: Optional[str] = Field(default=None)
    qubic_tx_hash: Optional[str] = Field(default=None)


# EasyConnect Event Log
class EasyConnectEvent(TimestampMixin, table=True):
    __tablename__ = "easyconnect_events"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    event_type: str = Field(index=True)  # rwa_verified, trade_completed, milestone_reached
    
    # Event data
    payload: dict = Field(default_factory=dict, sa_column=Column(JSON))
    
    # Delivery status
    delivered: bool = Field(default=False)
    delivery_attempts: int = Field(default=0)
    last_attempt_at: Optional[datetime] = Field(default=None)
    error_message: Optional[str] = Field(default=None)
    
    # Webhook response
    webhook_response: Optional[dict] = Field(default=None, sa_column=Column(JSON))
