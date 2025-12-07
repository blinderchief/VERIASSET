"""
VeriAssets - Real-time WebSocket API
Provides live updates for trades, prices, and auctions
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from typing import Dict, Set, Optional
import asyncio
import json
from datetime import datetime
from app.core.logging import logger

router = APIRouter(prefix="/ws", tags=["WebSocket"])

# Connection manager for WebSocket clients
class ConnectionManager:
    """Manages WebSocket connections and message broadcasting."""
    
    def __init__(self):
        # Channel-based connections: channel_name -> set of websockets
        self.active_connections: Dict[str, Set[WebSocket]] = {
            "trades": set(),
            "prices": set(),
            "auctions": set(),
            "governance": set(),
            "notifications": set(),
        }
        # User-specific connections: user_id -> websocket
        self.user_connections: Dict[str, WebSocket] = {}
        # Asset-specific subscriptions: asset_id -> set of websockets
        self.asset_subscriptions: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, channel: str, user_id: Optional[str] = None):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        
        if channel in self.active_connections:
            self.active_connections[channel].add(websocket)
        
        if user_id:
            self.user_connections[user_id] = websocket
        
        logger.info(f"WebSocket connected: channel={channel}, user={user_id}")
    
    def disconnect(self, websocket: WebSocket, channel: str, user_id: Optional[str] = None):
        """Remove a WebSocket connection."""
        if channel in self.active_connections:
            self.active_connections[channel].discard(websocket)
        
        if user_id and user_id in self.user_connections:
            del self.user_connections[user_id]
        
        # Clean up asset subscriptions
        for asset_id in list(self.asset_subscriptions.keys()):
            self.asset_subscriptions[asset_id].discard(websocket)
            if not self.asset_subscriptions[asset_id]:
                del self.asset_subscriptions[asset_id]
        
        logger.info(f"WebSocket disconnected: channel={channel}, user={user_id}")
    
    async def subscribe_asset(self, websocket: WebSocket, asset_id: str):
        """Subscribe to updates for a specific asset."""
        if asset_id not in self.asset_subscriptions:
            self.asset_subscriptions[asset_id] = set()
        self.asset_subscriptions[asset_id].add(websocket)
    
    async def unsubscribe_asset(self, websocket: WebSocket, asset_id: str):
        """Unsubscribe from asset updates."""
        if asset_id in self.asset_subscriptions:
            self.asset_subscriptions[asset_id].discard(websocket)
    
    async def broadcast_to_channel(self, channel: str, message: dict):
        """Broadcast message to all connections in a channel."""
        if channel not in self.active_connections:
            return
        
        dead_connections = set()
        message_str = json.dumps(message)
        
        for connection in self.active_connections[channel]:
            try:
                await connection.send_text(message_str)
            except Exception as e:
                logger.error(f"Error sending to websocket: {e}")
                dead_connections.add(connection)
        
        # Clean up dead connections
        self.active_connections[channel] -= dead_connections
    
    async def broadcast_to_asset(self, asset_id: str, message: dict):
        """Broadcast message to all subscribers of an asset."""
        if asset_id not in self.asset_subscriptions:
            return
        
        dead_connections = set()
        message_str = json.dumps(message)
        
        for connection in self.asset_subscriptions[asset_id]:
            try:
                await connection.send_text(message_str)
            except Exception as e:
                logger.error(f"Error sending to websocket: {e}")
                dead_connections.add(connection)
        
        # Clean up dead connections
        self.asset_subscriptions[asset_id] -= dead_connections
    
    async def send_to_user(self, user_id: str, message: dict):
        """Send a message to a specific user."""
        if user_id not in self.user_connections:
            return
        
        try:
            await self.user_connections[user_id].send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending to user {user_id}: {e}")
            del self.user_connections[user_id]


# Global connection manager instance
manager = ConnectionManager()


@router.websocket("/trades")
async def websocket_trades(websocket: WebSocket):
    """
    WebSocket endpoint for real-time trade updates.
    
    Messages sent:
    - trade_executed: New trade completed
    - order_placed: New order in orderbook
    - order_cancelled: Order removed from orderbook
    """
    await manager.connect(websocket, "trades")
    try:
        while True:
            # Receive messages from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle subscription to specific assets
            if message.get("action") == "subscribe":
                asset_id = message.get("asset_id")
                if asset_id:
                    await manager.subscribe_asset(websocket, asset_id)
                    await websocket.send_text(json.dumps({
                        "type": "subscribed",
                        "asset_id": asset_id,
                        "timestamp": datetime.utcnow().isoformat()
                    }))
            
            elif message.get("action") == "unsubscribe":
                asset_id = message.get("asset_id")
                if asset_id:
                    await manager.unsubscribe_asset(websocket, asset_id)
                    await websocket.send_text(json.dumps({
                        "type": "unsubscribed",
                        "asset_id": asset_id,
                        "timestamp": datetime.utcnow().isoformat()
                    }))
            
            # Heartbeat
            elif message.get("action") == "ping":
                await websocket.send_text(json.dumps({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                }))
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, "trades")


@router.websocket("/prices")
async def websocket_prices(websocket: WebSocket):
    """
    WebSocket endpoint for real-time price updates.
    
    Messages sent:
    - price_update: Asset price changed
    - volume_update: Trading volume changed
    """
    await manager.connect(websocket, "prices")
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("action") == "subscribe_assets":
                asset_ids = message.get("asset_ids", [])
                for asset_id in asset_ids:
                    await manager.subscribe_asset(websocket, asset_id)
                await websocket.send_text(json.dumps({
                    "type": "subscribed_assets",
                    "asset_ids": asset_ids,
                    "timestamp": datetime.utcnow().isoformat()
                }))
            
            elif message.get("action") == "ping":
                await websocket.send_text(json.dumps({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                }))
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, "prices")


@router.websocket("/auctions/{auction_id}")
async def websocket_auction(websocket: WebSocket, auction_id: str):
    """
    WebSocket endpoint for real-time Dutch auction updates.
    
    Messages sent:
    - price_tick: Current auction price (every second during auction)
    - bid_placed: New bid submitted
    - auction_filled: Auction completed
    """
    await manager.connect(websocket, "auctions")
    await manager.subscribe_asset(websocket, f"auction_{auction_id}")
    
    try:
        # Send initial auction state
        await websocket.send_text(json.dumps({
            "type": "auction_connected",
            "auction_id": auction_id,
            "timestamp": datetime.utcnow().isoformat()
        }))
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("action") == "ping":
                await websocket.send_text(json.dumps({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                }))
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, "auctions")


@router.websocket("/governance")
async def websocket_governance(websocket: WebSocket):
    """
    WebSocket endpoint for governance updates.
    
    Messages sent:
    - proposal_created: New proposal submitted
    - vote_cast: New vote on a proposal
    - proposal_passed: Proposal reached threshold
    - proposal_rejected: Proposal failed
    """
    await manager.connect(websocket, "governance")
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("action") == "subscribe_proposal":
                proposal_id = message.get("proposal_id")
                if proposal_id:
                    await manager.subscribe_asset(websocket, f"proposal_{proposal_id}")
            
            elif message.get("action") == "ping":
                await websocket.send_text(json.dumps({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                }))
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, "governance")


@router.websocket("/user/{user_id}")
async def websocket_user_notifications(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for user-specific notifications.
    
    Messages sent:
    - order_filled: User's order was filled
    - verification_complete: User's asset verified
    - bid_outbid: User was outbid in auction
    - proposal_update: Update on user's proposal
    """
    await manager.connect(websocket, "notifications", user_id)
    try:
        await websocket.send_text(json.dumps({
            "type": "connected",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }))
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("action") == "ping":
                await websocket.send_text(json.dumps({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                }))
            
            # Acknowledge receipt of notifications
            elif message.get("action") == "ack":
                notification_id = message.get("notification_id")
                await websocket.send_text(json.dumps({
                    "type": "ack_confirmed",
                    "notification_id": notification_id,
                    "timestamp": datetime.utcnow().isoformat()
                }))
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, "notifications", user_id)


# ============================================================================
# Event Broadcasting Functions (called from other parts of the application)
# ============================================================================

async def broadcast_trade_executed(trade_data: dict):
    """Broadcast a trade execution event."""
    await manager.broadcast_to_channel("trades", {
        "type": "trade_executed",
        "data": trade_data,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Also notify subscribers of the specific asset
    asset_id = trade_data.get("asset_id")
    if asset_id:
        await manager.broadcast_to_asset(asset_id, {
            "type": "trade_executed",
            "data": trade_data,
            "timestamp": datetime.utcnow().isoformat()
        })


async def broadcast_price_update(asset_id: str, new_price: float, volume_24h: float):
    """Broadcast a price update for an asset."""
    message = {
        "type": "price_update",
        "data": {
            "asset_id": asset_id,
            "price": new_price,
            "volume_24h": volume_24h
        },
        "timestamp": datetime.utcnow().isoformat()
    }
    
    await manager.broadcast_to_channel("prices", message)
    await manager.broadcast_to_asset(asset_id, message)


async def broadcast_auction_price_tick(auction_id: str, current_price: float, time_remaining: int):
    """Broadcast current auction price (for Dutch auction countdown)."""
    await manager.broadcast_to_asset(f"auction_{auction_id}", {
        "type": "price_tick",
        "data": {
            "auction_id": auction_id,
            "current_price": current_price,
            "time_remaining": time_remaining
        },
        "timestamp": datetime.utcnow().isoformat()
    })


async def broadcast_auction_bid(auction_id: str, bid_data: dict):
    """Broadcast a new auction bid."""
    await manager.broadcast_to_channel("auctions", {
        "type": "bid_placed",
        "data": {
            "auction_id": auction_id,
            **bid_data
        },
        "timestamp": datetime.utcnow().isoformat()
    })
    
    await manager.broadcast_to_asset(f"auction_{auction_id}", {
        "type": "bid_placed",
        "data": bid_data,
        "timestamp": datetime.utcnow().isoformat()
    })


async def broadcast_governance_vote(proposal_id: str, vote_data: dict):
    """Broadcast a governance vote."""
    await manager.broadcast_to_channel("governance", {
        "type": "vote_cast",
        "data": {
            "proposal_id": proposal_id,
            **vote_data
        },
        "timestamp": datetime.utcnow().isoformat()
    })
    
    await manager.broadcast_to_asset(f"proposal_{proposal_id}", {
        "type": "vote_cast",
        "data": vote_data,
        "timestamp": datetime.utcnow().isoformat()
    })


async def send_user_notification(user_id: str, notification_type: str, data: dict):
    """Send a notification to a specific user."""
    await manager.send_to_user(user_id, {
        "type": notification_type,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    })


# ============================================================================
# Background Tasks
# ============================================================================

async def auction_price_ticker(auction_id: str, start_price: float, end_price: float, duration_seconds: int):
    """
    Background task that broadcasts price ticks for a Dutch auction.
    Price decreases linearly from start_price to end_price over duration_seconds.
    """
    price_decrement = (start_price - end_price) / duration_seconds
    current_price = start_price
    
    for remaining in range(duration_seconds, 0, -1):
        await broadcast_auction_price_tick(auction_id, current_price, remaining)
        await asyncio.sleep(1)
        current_price -= price_decrement
    
    # Final price
    await broadcast_auction_price_tick(auction_id, end_price, 0)
