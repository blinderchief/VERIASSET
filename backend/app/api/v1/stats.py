"""
Market Statistics API Routes
Real-time market data and analytics endpoints
"""

from typing import List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc

from app.db.database import get_session
from app.db.models import RWAAsset, Trade, AssetType, AssetStatus, TradeStatus
from app.core.logging import get_logger
from pydantic import BaseModel

logger = get_logger(__name__)

router = APIRouter(prefix="/stats", tags=["Statistics"])


# ==================== Response Models ====================

class MarketStats(BaseModel):
    total_volume_24h: float
    total_volume_change: float
    total_trades_24h: int
    trades_change: float
    active_listings: int
    listings_change: int
    avg_price: float
    price_change: float


class TopAsset(BaseModel):
    id: str
    name: str
    symbol: str
    price: float
    change_24h: float
    volume_24h: float
    asset_type: str


class RecentTrade(BaseModel):
    id: str
    asset_symbol: str
    trade_type: str
    quantity: float
    price: float
    total_value: float
    executed_at: datetime


class AssetDistribution(BaseModel):
    asset_type: str
    count: int
    percentage: float
    total_value: float


class MarketAnalytics(BaseModel):
    market_stats: MarketStats
    top_assets: List[TopAsset]
    recent_trades: List[RecentTrade]
    asset_distribution: List[AssetDistribution]
    last_updated: datetime


# ==================== Endpoints ====================

@router.get("/market", response_model=MarketAnalytics)
async def get_market_analytics(
    session: AsyncSession = Depends(get_session),
):
    """
    Get comprehensive market analytics including:
    - Overall market statistics (24h volume, trades, etc.)
    - Top performing assets
    - Recent trades
    - Asset type distribution
    """
    now = datetime.utcnow()
    yesterday = now - timedelta(days=1)
    two_days_ago = now - timedelta(days=2)
    
    # ==================== Market Stats ====================
    
    # Get 24h trade volume and count
    trades_24h_query = select(
        func.count(Trade.id).label('trade_count'),
        func.coalesce(func.sum(Trade.total_value), 0).label('total_volume')
    ).where(
        and_(
            Trade.status == TradeStatus.EXECUTED,
            Trade.executed_at >= yesterday
        )
    )
    trades_24h_result = await session.execute(trades_24h_query)
    trades_24h = trades_24h_result.first()
    
    # Get previous 24h for comparison
    trades_prev_query = select(
        func.count(Trade.id).label('trade_count'),
        func.coalesce(func.sum(Trade.total_value), 0).label('total_volume')
    ).where(
        and_(
            Trade.status == TradeStatus.EXECUTED,
            Trade.executed_at >= two_days_ago,
            Trade.executed_at < yesterday
        )
    )
    trades_prev_result = await session.execute(trades_prev_query)
    trades_prev = trades_prev_result.first()
    
    # Calculate changes
    volume_24h = float(trades_24h.total_volume or 0)
    volume_prev = float(trades_prev.total_volume or 1)  # Avoid division by zero
    volume_change = ((volume_24h - volume_prev) / volume_prev * 100) if volume_prev > 0 else 0
    
    trades_count_24h = int(trades_24h.trade_count or 0)
    trades_count_prev = int(trades_prev.trade_count or 1)
    trades_change = ((trades_count_24h - trades_count_prev) / trades_count_prev * 100) if trades_count_prev > 0 else 0
    
    # Get active listings count
    listings_query = select(func.count(RWAAsset.id)).where(
        RWAAsset.status == AssetStatus.ACTIVE
    )
    listings_result = await session.execute(listings_query)
    active_listings = listings_result.scalar() or 0
    
    # Get average price
    avg_price_query = select(func.avg(RWAAsset.price_per_unit)).where(
        RWAAsset.status == AssetStatus.ACTIVE
    )
    avg_price_result = await session.execute(avg_price_query)
    avg_price = float(avg_price_result.scalar() or 0)
    
    market_stats = MarketStats(
        total_volume_24h=volume_24h,
        total_volume_change=round(volume_change, 1),
        total_trades_24h=trades_count_24h,
        trades_change=round(trades_change, 1),
        active_listings=active_listings,
        listings_change=0,  # Would need historical data
        avg_price=round(avg_price, 2),
        price_change=0,  # Would need historical data
    )
    
    # ==================== Top Assets ====================
    
    # Get top assets by 24h volume
    top_assets_query = select(
        RWAAsset,
        func.coalesce(func.sum(Trade.total_value), 0).label('volume_24h')
    ).outerjoin(
        Trade,
        and_(
            Trade.asset_id == RWAAsset.id,
            Trade.status == TradeStatus.EXECUTED,
            Trade.executed_at >= yesterday
        )
    ).where(
        RWAAsset.status == AssetStatus.ACTIVE
    ).group_by(
        RWAAsset.id
    ).order_by(
        desc('volume_24h')
    ).limit(5)
    
    top_assets_result = await session.execute(top_assets_query)
    top_assets = []
    
    for row in top_assets_result:
        asset = row[0]
        volume = float(row[1] or 0)
        top_assets.append(TopAsset(
            id=str(asset.id),
            name=asset.name,
            symbol=asset.symbol,
            price=float(asset.price_per_unit),
            change_24h=0,  # Would need price history
            volume_24h=volume,
            asset_type=asset.asset_type.value,
        ))
    
    # ==================== Recent Trades ====================
    
    recent_trades_query = select(Trade).where(
        Trade.status == TradeStatus.EXECUTED
    ).order_by(
        desc(Trade.executed_at)
    ).limit(10)
    
    recent_trades_result = await session.execute(recent_trades_query)
    recent_trades = []
    
    for trade in recent_trades_result.scalars():
        # Get asset symbol
        asset_query = select(RWAAsset.symbol).where(RWAAsset.id == trade.asset_id)
        asset_result = await session.execute(asset_query)
        asset_symbol = asset_result.scalar() or "UNKNOWN"
        
        recent_trades.append(RecentTrade(
            id=str(trade.id),
            asset_symbol=asset_symbol,
            trade_type=trade.trade_type.value,
            quantity=float(trade.quantity),
            price=float(trade.price_per_unit),
            total_value=float(trade.total_value),
            executed_at=trade.executed_at or trade.created_at,
        ))
    
    # ==================== Asset Distribution ====================
    
    distribution_query = select(
        RWAAsset.asset_type,
        func.count(RWAAsset.id).label('count'),
        func.coalesce(func.sum(RWAAsset.price_per_unit * RWAAsset.total_supply), 0).label('total_value')
    ).where(
        RWAAsset.status == AssetStatus.ACTIVE
    ).group_by(
        RWAAsset.asset_type
    )
    
    distribution_result = await session.execute(distribution_query)
    distribution_rows = distribution_result.all()
    
    total_assets = sum(row.count for row in distribution_rows) or 1
    
    asset_distribution = []
    for row in distribution_rows:
        asset_distribution.append(AssetDistribution(
            asset_type=row.asset_type.value,
            count=row.count,
            percentage=round(row.count / total_assets * 100, 1),
            total_value=float(row.total_value),
        ))
    
    return MarketAnalytics(
        market_stats=market_stats,
        top_assets=top_assets,
        recent_trades=recent_trades,
        asset_distribution=asset_distribution,
        last_updated=now,
    )


@router.get("/summary")
async def get_quick_stats(
    session: AsyncSession = Depends(get_session),
):
    """
    Get quick summary stats for dashboard header
    """
    # Total assets
    assets_count = await session.execute(
        select(func.count(RWAAsset.id)).where(RWAAsset.status == AssetStatus.ACTIVE)
    )
    
    # Total trades
    trades_count = await session.execute(
        select(func.count(Trade.id)).where(Trade.status == TradeStatus.EXECUTED)
    )
    
    # Total volume
    total_volume = await session.execute(
        select(func.coalesce(func.sum(Trade.total_value), 0))
        .where(Trade.status == TradeStatus.EXECUTED)
    )
    
    return {
        "total_assets": assets_count.scalar() or 0,
        "total_trades": trades_count.scalar() or 0,
        "total_volume": float(total_volume.scalar() or 0),
        "last_updated": datetime.utcnow(),
    }
