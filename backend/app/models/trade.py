"""
Pydantic Schemas for Trading Operations
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.db.models import TradeStatus


class BaseSchema(BaseModel):
    """Base schema with common config"""
    model_config = {"from_attributes": True}


# ==================== Trade Schemas ====================

class TradeCreate(BaseModel):
    """Schema for creating a new trade"""
    asset_id: str = Field(..., description="Asset ID to trade")
    trade_type: str = Field(..., pattern="^(buy|sell)$", description="Trade type: buy or sell")
    quantity: int = Field(..., ge=1, description="Number of units to trade")
    price_per_unit: float = Field(..., ge=0, description="Price per unit in QUBIC")
    
    # Optional Qubic wallet details
    qubic_public_key: Optional[str] = Field(None, description="Buyer's Qubic public key")
    max_slippage: float = Field(default=0.01, ge=0, le=0.5, description="Max slippage tolerance")


class TradeResponse(BaseSchema):
    """Schema for trade response"""
    id: str
    asset_id: str
    user_id: str
    
    trade_type: str
    status: TradeStatus
    
    quantity: int
    price_per_unit: float
    total_amount: float
    fee_amount: float
    fee_burned: float
    
    qubic_tx_hash: Optional[str]
    qubic_tick: Optional[int]
    
    settled_at: Optional[datetime]
    
    created_at: datetime
    updated_at: datetime


class TradeListResponse(BaseModel):
    """Schema for paginated trade list"""
    items: List[TradeResponse]
    total: int
    page: int
    page_size: int


class TradeExecuteRequest(BaseModel):
    """Schema for executing a trade on Qubic"""
    trade_id: str = Field(..., description="Trade ID to execute")
    qubic_seed: Optional[str] = Field(None, description="Qubic seed for signing (dev only)")


class TradeExecuteResponse(BaseModel):
    """Schema for trade execution response"""
    trade_id: str
    status: str
    qubic_tx_hash: Optional[str]
    qubic_tick: Optional[int]
    message: str
    fee_burned: float


# ==================== Market Data Schemas ====================

class MarketStats(BaseModel):
    """Schema for market statistics"""
    asset_id: str
    asset_name: str
    symbol: str
    
    current_price: float
    price_change_24h: float
    price_change_percentage_24h: float
    
    volume_24h: float
    total_trades_24h: int
    
    market_cap: float
    circulating_supply: int
    total_supply: int
    
    highest_bid: Optional[float]
    lowest_ask: Optional[float]


class OrderBookEntry(BaseModel):
    """Schema for order book entry"""
    price: float
    quantity: int
    total: float
    cumulative: float


class OrderBook(BaseModel):
    """Schema for order book"""
    asset_id: str
    bids: List[OrderBookEntry]  # Buy orders
    asks: List[OrderBookEntry]  # Sell orders
    spread: float
    spread_percentage: float
    last_updated: datetime


class PriceHistory(BaseModel):
    """Schema for price history entry"""
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float


class PriceHistoryResponse(BaseModel):
    """Schema for price history response"""
    asset_id: str
    interval: str  # 1h, 4h, 1d, 1w
    data: List[PriceHistory]
