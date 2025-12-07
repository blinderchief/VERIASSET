"""
Pydantic Schemas for Nostromo Launchpad Operations
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.db.models import ProposalStatus


class BaseSchema(BaseModel):
    """Base schema with common config"""
    model_config = {"from_attributes": True}


# ==================== Proposal Schemas ====================

class ProposalCreate(BaseModel):
    """Schema for creating a new Nostromo proposal"""
    asset_id: str = Field(..., description="Asset ID for the proposal")
    title: str = Field(..., min_length=5, max_length=200, description="Proposal title")
    description: str = Field(..., min_length=50, max_length=10000, description="Detailed description")
    pitch_deck_url: Optional[str] = Field(None, description="URL to pitch deck")
    
    # IPO Configuration
    ipo_start_price: float = Field(default=100.0, ge=1, description="Starting price for Dutch auction")
    ipo_end_price: Optional[float] = Field(None, ge=0.1, description="Minimum price (default: 10% of start)")
    ipo_total_shares: int = Field(default=10000, ge=100, description="Total shares to offer")
    ipo_duration_days: int = Field(default=7, ge=1, le=30, description="IPO duration in days")


class ProposalUpdate(BaseModel):
    """Schema for updating a proposal (only while in draft)"""
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    description: Optional[str] = Field(None, min_length=50, max_length=10000)
    pitch_deck_url: Optional[str] = None
    ipo_start_price: Optional[float] = Field(None, ge=1)
    ipo_end_price: Optional[float] = Field(None, ge=0.1)


class ProposalResponse(BaseSchema):
    """Schema for proposal response"""
    id: str
    asset_id: str
    status: ProposalStatus
    
    title: str
    description: str
    pitch_deck_url: Optional[str]
    
    votes_for: int
    votes_against: int
    quorum_required: int
    voting_deadline: Optional[datetime]
    
    ipo_start_price: Optional[float]
    ipo_end_price: Optional[float]
    ipo_total_shares: Optional[int]
    ipo_shares_sold: int
    ipo_start_time: Optional[datetime]
    ipo_end_time: Optional[datetime]
    
    final_price: Optional[float]
    total_raised: float
    
    qubic_proposal_id: Optional[str]
    
    created_at: datetime
    updated_at: datetime


class ProposalListResponse(BaseModel):
    """Schema for paginated proposal list"""
    items: List[ProposalResponse]
    total: int
    page: int
    page_size: int


# ==================== Voting Schemas ====================

class VoteRequest(BaseModel):
    """Schema for casting a vote (for demo purposes)"""
    proposal_id: str = Field(..., description="Proposal ID to vote on")
    vote: str = Field(..., pattern="^(for|against)$", description="Vote: for or against")
    computor_id: Optional[str] = Field(None, description="Computor ID (for demo)")


class ProposalVoteRequest(BaseModel):
    """Schema for voting on a proposal"""
    vote_for: bool = Field(..., description="True to vote FOR, False to vote AGAINST")
    voting_power: Optional[int] = Field(default=1, ge=1, description="Voting power (based on token holdings)")


class ProposalVoteResponse(BaseModel):
    """Schema for vote response"""
    proposal_id: str
    voted_for: bool
    voting_power: int
    current_votes_for: int
    current_votes_against: int
    message: str


class VoteStatusResponse(BaseModel):
    """Schema for vote status"""
    proposal_id: str
    qubic_proposal_id: Optional[str]
    votes_for: int
    votes_against: int
    total_votes: int
    quorum_required: int
    quorum_reached: bool
    approval_percentage: float
    status: str
    voting_deadline: Optional[datetime]


# ==================== IPO Schemas ====================

class IPOStartRequest(BaseModel):
    """Schema for starting an IPO"""
    proposal_id: str = Field(..., description="Approved proposal ID")


class IPOStatusResponse(BaseModel):
    """Schema for IPO status"""
    proposal_id: str
    status: str
    
    start_time: datetime
    end_time: datetime
    time_remaining_hours: float
    
    start_price: float
    end_price: float
    current_price: float
    
    total_shares: int
    shares_sold: int
    shares_remaining: int
    
    total_raised: float
    participation_count: int


class IPOParticipateRequest(BaseModel):
    """Schema for participating in IPO"""
    proposal_id: str = Field(..., description="Proposal ID")
    shares_to_buy: int = Field(..., ge=1, description="Number of shares to buy")
    max_price_per_share: float = Field(..., ge=0, description="Maximum price willing to pay")
    qubic_public_key: str = Field(..., description="Buyer's Qubic public key")


class IPOParticipateResponse(BaseModel):
    """Schema for IPO participation response"""
    success: bool
    proposal_id: str
    shares_purchased: int
    price_per_share: float
    total_cost: float
    shares_remaining: int
    message: str
    qubic_tx_hash: Optional[str]


# ==================== Dashboard/Stats Schemas ====================

class LaunchpadStats(BaseModel):
    """Schema for launchpad statistics"""
    total_proposals: int
    proposals_voting: int
    proposals_approved: int
    proposals_rejected: int
    active_ipos: int
    completed_ipos: int
    total_raised: float
    total_participants: int


class TrendingProposal(BaseModel):
    """Schema for trending proposal summary"""
    id: str
    asset_id: str
    title: str
    status: str
    votes_for: int
    votes_against: int
    total_raised: Optional[float]
    current_price: Optional[float]
    time_remaining: Optional[str]


# ==================== Dutch Auction IPO Schemas ====================

class IPOStatus(str):
    """IPO Status enum"""
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class DutchAuctionIPO(BaseModel):
    """Schema for Dutch Auction IPO details"""
    proposal_id: str
    asset_id: str
    asset_name: str
    symbol: str
    
    start_price: float
    current_price: float
    reserve_price: float
    
    token_allocation: int
    tokens_remaining: int
    
    started_at: Optional[datetime]
    ends_at: Optional[datetime]
    
    status: str


class IPOBidRequest(BaseModel):
    """Schema for placing an IPO bid"""
    quantity: int = Field(..., ge=1, description="Number of tokens to buy")
    max_price: float = Field(..., ge=0, description="Maximum price willing to pay per token")


class IPOBidResponse(BaseModel):
    """Schema for IPO bid response"""
    proposal_id: str
    status: str
    tokens_received: int
    price_paid: float
    execution_price: Optional[float] = None
    qubic_tx_hash: Optional[str] = None
    message: str
