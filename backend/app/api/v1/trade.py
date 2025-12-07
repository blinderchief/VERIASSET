"""
Trading API Routes
Endpoints for buying, selling, and trading RWA assets
"""

from typing import List, Optional
from datetime import datetime, timedelta
import math

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.database import get_session
from app.db.models import RWAAsset, User, Trade, AssetStatus, TradeStatus
from app.models.trade import (
    TradeCreate,
    TradeResponse,
    TradeListResponse,
    TradeExecuteRequest,
    TradeExecuteResponse,
    MarketStats,
    OrderBook,
    OrderBookEntry,
)
from app.services.qubic_rpc import QubicRPCClient
from app.services.easyconnect import EasyConnectService, get_easyconnect_service
from app.api.v1.deps import get_current_user
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/trade", tags=["Trading"])

# Fee configuration (0.3% burned as per PRD)
TRADE_FEE_PERCENTAGE = 0.003


# ==================== Trade Operations ====================

@router.post("", response_model=TradeResponse, status_code=status.HTTP_201_CREATED)
async def create_trade(
    trade_data: TradeCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new trade order (buy or sell).
    """
    # Get asset
    result = await session.execute(
        select(RWAAsset).where(RWAAsset.id == trade_data.asset_id)
    )
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    if asset.status != AssetStatus.LISTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Asset is not available for trading"
        )
    
    # Calculate amounts
    total_amount = trade_data.quantity * trade_data.price_per_unit
    fee_amount = total_amount * TRADE_FEE_PERCENTAGE
    fee_burned = fee_amount  # 100% of fee is burned
    
    # Validate quantity for sells
    if trade_data.trade_type == "sell":
        # In production: check user's holdings
        pass
    
    # Create trade record
    trade = Trade(
        asset_id=trade_data.asset_id,
        user_id=current_user.id,
        trade_type=trade_data.trade_type,
        status=TradeStatus.PENDING,
        quantity=trade_data.quantity,
        price_per_unit=trade_data.price_per_unit,
        total_amount=total_amount,
        fee_amount=fee_amount,
        fee_burned=fee_burned,
    )
    
    session.add(trade)
    await session.flush()
    
    logger.info(
        f"Trade created: {trade.id} - {trade_data.trade_type} {trade_data.quantity} "
        f"{asset.symbol} @ {trade_data.price_per_unit} QUBIC"
    )
    
    return TradeResponse.model_validate(trade)


@router.post("/{trade_id}/execute", response_model=TradeExecuteResponse)
async def execute_trade(
    trade_id: str,
    execute_data: TradeExecuteRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Execute a pending trade on the Qubic network.
    
    This creates and broadcasts the transaction to Qubic.
    """
    # Get trade
    result = await session.execute(
        select(Trade).where(Trade.id == trade_id)
    )
    trade = result.scalar_one_or_none()
    
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found"
        )
    
    if trade.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to execute this trade"
        )
    
    if trade.status != TradeStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Trade is already {trade.status.value}"
        )
    
    # Get asset
    result = await session.execute(
        select(RWAAsset).where(RWAAsset.id == trade.asset_id)
    )
    asset = result.scalar_one_or_none()
    
    try:
        # Execute on Qubic network
        async with QubicRPCClient() as qubic:
            # Get current tick
            current_tick = await qubic.get_current_tick()
            target_tick = current_tick + 30  # Schedule for future tick
            
            # In production: Create and sign actual transaction
            # For demo: simulate execution
            
            # Simulate successful execution
            tx_hash = f"QT{trade_id[:16].upper()}"
            
            # Update trade status
            trade.status = TradeStatus.COMPLETED
            trade.qubic_tx_hash = tx_hash
            trade.qubic_tick = target_tick
            trade.settled_at = datetime.utcnow()
            
            # Update asset circulating supply
            if trade.trade_type == "buy":
                asset.circulating_supply += trade.quantity
            
            # Send EasyConnect notification
            try:
                async with get_easyconnect_service() as ec:
                    await ec.notify_trade_completed(
                        trade_id=trade.id,
                        asset_id=asset.id,
                        asset_name=asset.name,
                        trade_type=trade.trade_type,
                        quantity=trade.quantity,
                        price=trade.price_per_unit,
                        total_amount=trade.total_amount,
                        buyer_address=current_user.qubic_public_key or "unknown",
                        qubic_tx_hash=tx_hash,
                    )
                    
                    # Check for milestone
                    if trade.total_amount >= 1000:
                        await ec.notify_trade_milestone(
                            asset_id=asset.id,
                            asset_name=asset.name,
                            milestone_amount=1000,
                            total_volume=trade.total_amount,
                            trader_address=current_user.qubic_public_key or "unknown",
                            airdrop_amount=10,  # VERI airdrop
                        )
            except Exception as e:
                logger.warning(f"Failed to send EasyConnect notification: {e}")
            
            logger.info(f"Trade executed: {trade_id} at tick {target_tick}")
            
            return TradeExecuteResponse(
                trade_id=trade.id,
                status="completed",
                qubic_tx_hash=tx_hash,
                qubic_tick=target_tick,
                message=f"Trade executed successfully. {trade.fee_burned} QUBIC burned.",
                fee_burned=trade.fee_burned,
            )
            
    except Exception as e:
        logger.error(f"Trade execution failed: {e}")
        trade.status = TradeStatus.FAILED
        trade.settlement_data = {"error": str(e)}
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Trade execution failed: {str(e)}"
        )


@router.post("/{trade_id}/cancel", response_model=TradeResponse)
async def cancel_trade(
    trade_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Cancel a pending trade.
    """
    result = await session.execute(
        select(Trade).where(Trade.id == trade_id)
    )
    trade = result.scalar_one_or_none()
    
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found"
        )
    
    if trade.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this trade"
        )
    
    if trade.status != TradeStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel trade with status {trade.status.value}"
        )
    
    trade.status = TradeStatus.CANCELLED
    trade.updated_at = datetime.utcnow()
    
    logger.info(f"Trade cancelled: {trade_id}")
    
    return TradeResponse.model_validate(trade)


# ==================== Trade History ====================

@router.get("", response_model=TradeListResponse)
async def list_trades(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    asset_id: Optional[str] = Query(None, description="Filter by asset"),
    trade_type: Optional[str] = Query(None, pattern="^(buy|sell)$"),
    status_filter: Optional[TradeStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """
    List trades for the current user.
    """
    query = select(Trade).where(Trade.user_id == current_user.id)
    
    if asset_id:
        query = query.where(Trade.asset_id == asset_id)
    if trade_type:
        query = query.where(Trade.trade_type == trade_type)
    if status_filter:
        query = query.where(Trade.status == status_filter)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar() or 0
    
    # Apply pagination
    query = query.order_by(Trade.created_at.desc())
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    result = await session.execute(query)
    trades = result.scalars().all()
    
    return TradeListResponse(
        items=[TradeResponse.model_validate(t) for t in trades],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{trade_id}", response_model=TradeResponse)
async def get_trade(
    trade_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get details of a specific trade.
    """
    result = await session.execute(
        select(Trade).where(Trade.id == trade_id)
    )
    trade = result.scalar_one_or_none()
    
    if not trade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trade not found"
        )
    
    if trade.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this trade"
        )
    
    return TradeResponse.model_validate(trade)


# ==================== Market Data ====================

@router.get("/market/{asset_id}/stats", response_model=MarketStats)
async def get_market_stats(
    asset_id: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Get market statistics for an asset.
    """
    # Get asset
    result = await session.execute(
        select(RWAAsset).where(RWAAsset.id == asset_id)
    )
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    # Calculate 24h stats
    yesterday = datetime.utcnow() - timedelta(days=1)
    
    # Get trades in last 24h
    trades_query = select(Trade).where(
        Trade.asset_id == asset_id,
        Trade.status == TradeStatus.COMPLETED,
        Trade.created_at >= yesterday,
    )
    result = await session.execute(trades_query)
    recent_trades = result.scalars().all()
    
    volume_24h = sum(t.total_amount for t in recent_trades)
    total_trades_24h = len(recent_trades)
    
    # Calculate price change (simplified)
    price_change_24h = 0.0
    if recent_trades:
        first_price = recent_trades[-1].price_per_unit if recent_trades else asset.price_per_unit
        current_price = asset.price_per_unit
        price_change_24h = current_price - first_price
    
    return MarketStats(
        asset_id=asset_id,
        asset_name=asset.name,
        symbol=asset.symbol,
        current_price=asset.price_per_unit,
        price_change_24h=price_change_24h,
        price_change_percentage_24h=(
            (price_change_24h / asset.price_per_unit * 100) 
            if asset.price_per_unit > 0 else 0
        ),
        volume_24h=volume_24h,
        total_trades_24h=total_trades_24h,
        market_cap=asset.price_per_unit * asset.circulating_supply,
        circulating_supply=asset.circulating_supply,
        total_supply=asset.total_supply,
        highest_bid=None,  # Would come from order book
        lowest_ask=None,
    )


@router.get("/market/{asset_id}/orderbook", response_model=OrderBook)
async def get_order_book(
    asset_id: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Get the order book for an asset.
    """
    # Get pending trades (simplified order book)
    buy_orders_query = select(Trade).where(
        Trade.asset_id == asset_id,
        Trade.status == TradeStatus.PENDING,
        Trade.trade_type == "buy",
    ).order_by(Trade.price_per_unit.desc())
    
    sell_orders_query = select(Trade).where(
        Trade.asset_id == asset_id,
        Trade.status == TradeStatus.PENDING,
        Trade.trade_type == "sell",
    ).order_by(Trade.price_per_unit.asc())
    
    buy_result = await session.execute(buy_orders_query)
    sell_result = await session.execute(sell_orders_query)
    
    buy_orders = buy_result.scalars().all()
    sell_orders = sell_result.scalars().all()
    
    # Build order book entries
    def build_entries(orders: List[Trade]) -> List[OrderBookEntry]:
        entries = []
        cumulative = 0.0
        for order in orders:
            total = order.quantity * order.price_per_unit
            cumulative += total
            entries.append(OrderBookEntry(
                price=order.price_per_unit,
                quantity=order.quantity,
                total=total,
                cumulative=cumulative,
            ))
        return entries
    
    bids = build_entries(buy_orders)
    asks = build_entries(sell_orders)
    
    # Calculate spread
    highest_bid = bids[0].price if bids else 0
    lowest_ask = asks[0].price if asks else 0
    spread = lowest_ask - highest_bid if highest_bid and lowest_ask else 0
    spread_percentage = (spread / highest_bid * 100) if highest_bid > 0 else 0
    
    return OrderBook(
        asset_id=asset_id,
        bids=bids,
        asks=asks,
        spread=spread,
        spread_percentage=spread_percentage,
        last_updated=datetime.utcnow(),
    )
