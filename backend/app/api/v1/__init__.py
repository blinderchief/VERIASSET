"""
API v1 Router
Aggregates all API routes
"""

from fastapi import APIRouter

from app.api.v1 import rwa, trade, nostromo, users, websocket, stats

api_router = APIRouter()

# Include all route modules
api_router.include_router(rwa.router)
api_router.include_router(trade.router)
api_router.include_router(nostromo.router)
api_router.include_router(users.router)
api_router.include_router(websocket.router)
api_router.include_router(stats.router)
