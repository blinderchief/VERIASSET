"""
VeriAssets Pydantic Models Module
"""

from app.models.rwa import (
    AssetCreate,
    AssetUpdate,
    AssetResponse,
    AssetListResponse,
    AssetDetailResponse,
    VerificationRequest,
    VerificationResponse,
    AIVerificationResult,
    AssetFilters,
    PaginationParams,
)

from app.models.trade import (
    TradeCreate,
    TradeResponse,
    TradeListResponse,
    TradeExecuteRequest,
    TradeExecuteResponse,
    MarketStats,
    OrderBook,
    OrderBookEntry,
    PriceHistory,
    PriceHistoryResponse,
)

from app.models.nostromo import (
    ProposalCreate,
    ProposalUpdate,
    ProposalResponse,
    ProposalListResponse,
    VoteRequest,
    VoteStatusResponse,
    IPOStartRequest,
    IPOStatusResponse,
    IPOParticipateRequest,
    IPOParticipateResponse,
    LaunchpadStats,
    TrendingProposal,
)

from app.models.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserProfileResponse,
    WalletConnectRequest,
    QubicWalletConnectRequest,
    WalletBalanceResponse,
    ClerkWebhookPayload,
    TokenResponse,
    CurrentUser,
)

__all__ = [
    # RWA
    "AssetCreate",
    "AssetUpdate",
    "AssetResponse",
    "AssetListResponse",
    "AssetDetailResponse",
    "VerificationRequest",
    "VerificationResponse",
    "AIVerificationResult",
    "AssetFilters",
    "PaginationParams",
    # Trade
    "TradeCreate",
    "TradeResponse",
    "TradeListResponse",
    "TradeExecuteRequest",
    "TradeExecuteResponse",
    "MarketStats",
    "OrderBook",
    "OrderBookEntry",
    "PriceHistory",
    "PriceHistoryResponse",
    # Nostromo
    "ProposalCreate",
    "ProposalUpdate",
    "ProposalResponse",
    "ProposalListResponse",
    "VoteRequest",
    "VoteStatusResponse",
    "IPOStartRequest",
    "IPOStatusResponse",
    "IPOParticipateRequest",
    "IPOParticipateResponse",
    "LaunchpadStats",
    "TrendingProposal",
    # User
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserProfileResponse",
    "WalletConnectRequest",
    "QubicWalletConnectRequest",
    "WalletBalanceResponse",
    "ClerkWebhookPayload",
    "TokenResponse",
    "CurrentUser",
]
