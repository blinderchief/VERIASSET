"""
User Management API Routes
Endpoints for user profile, settings, and wallet management
"""

from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_session
from app.db.models import User
from app.models.user import (
    UserProfile,
    UserProfileUpdate,
    UserWalletConnect,
    UserWalletResponse,
    UserSettings,
    UserSettingsUpdate,
    UserStatsResponse,
    ClerkWebhookPayload,
)
from app.api.v1.deps import get_current_user
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])


# ==================== Profile Management ====================

@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """
    Get the current user's profile.
    """
    return UserProfile(
        id=current_user.id,
        clerk_id=current_user.clerk_id,
        email=current_user.email,
        name=current_user.name,
        avatar_url=current_user.avatar_url,
        qubic_public_key=current_user.qubic_public_key,
        is_verified=current_user.is_verified,
        is_admin=current_user.is_admin,
        created_at=current_user.created_at,
        wallet_connected=bool(current_user.qubic_public_key),
    )


@router.patch("/me", response_model=UserProfile)
async def update_current_user_profile(
    update_data: UserProfileUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Update the current user's profile.
    """
    if update_data.name is not None:
        current_user.name = update_data.name
    
    if update_data.avatar_url is not None:
        current_user.avatar_url = update_data.avatar_url
    
    current_user.updated_at = datetime.utcnow()
    
    logger.info(f"User profile updated: {current_user.id}")
    
    return UserProfile(
        id=current_user.id,
        clerk_id=current_user.clerk_id,
        email=current_user.email,
        name=current_user.name,
        avatar_url=current_user.avatar_url,
        qubic_public_key=current_user.qubic_public_key,
        is_verified=current_user.is_verified,
        is_admin=current_user.is_admin,
        created_at=current_user.created_at,
        wallet_connected=bool(current_user.qubic_public_key),
    )


# ==================== Wallet Management ====================

@router.post("/me/wallet", response_model=UserWalletResponse)
async def connect_wallet(
    wallet_data: UserWalletConnect,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Connect a Qubic wallet to the user's account.
    
    In production, this would verify wallet ownership via signature.
    """
    # Basic validation of Qubic address format
    if not wallet_data.qubic_public_key or len(wallet_data.qubic_public_key) < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Qubic public key format"
        )
    
    # Check if wallet is already connected to another user
    existing = await session.execute(
        select(User).where(
            User.qubic_public_key == wallet_data.qubic_public_key,
            User.id != current_user.id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Wallet already connected to another account"
        )
    
    # TODO: In production, verify signature to prove wallet ownership
    # signature_valid = verify_qubic_signature(
    #     wallet_data.qubic_public_key,
    #     wallet_data.signature,
    #     wallet_data.message
    # )
    
    current_user.qubic_public_key = wallet_data.qubic_public_key
    current_user.updated_at = datetime.utcnow()
    
    logger.info(f"Wallet connected for user {current_user.id}: {wallet_data.qubic_public_key[:16]}...")
    
    return UserWalletResponse(
        qubic_public_key=current_user.qubic_public_key,
        connected_at=datetime.utcnow(),
        message="Wallet connected successfully",
    )


@router.delete("/me/wallet")
async def disconnect_wallet(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Disconnect the Qubic wallet from the user's account.
    """
    if not current_user.qubic_public_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No wallet connected"
        )
    
    current_user.qubic_public_key = None
    current_user.updated_at = datetime.utcnow()
    
    logger.info(f"Wallet disconnected for user {current_user.id}")
    
    return {"message": "Wallet disconnected successfully"}


@router.get("/me/wallet", response_model=UserWalletResponse)
async def get_wallet_status(
    current_user: User = Depends(get_current_user),
):
    """
    Get the current user's wallet connection status.
    """
    if not current_user.qubic_public_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No wallet connected"
        )
    
    return UserWalletResponse(
        qubic_public_key=current_user.qubic_public_key,
        connected_at=current_user.updated_at,  # Approximate
        message="Wallet connected",
    )


# ==================== User Settings ====================

@router.get("/me/settings", response_model=UserSettings)
async def get_user_settings(
    current_user: User = Depends(get_current_user),
):
    """
    Get the current user's settings.
    """
    # Settings stored in user metadata (simplified)
    return UserSettings(
        email_notifications=True,
        trade_alerts=True,
        proposal_updates=True,
        marketing_emails=False,
        preferred_currency="USD",
        timezone="UTC",
    )


@router.patch("/me/settings", response_model=UserSettings)
async def update_user_settings(
    settings_data: UserSettingsUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Update the current user's settings.
    """
    # In production, store in user metadata or separate settings table
    logger.info(f"User settings updated: {current_user.id}")
    
    return UserSettings(
        email_notifications=settings_data.email_notifications or True,
        trade_alerts=settings_data.trade_alerts or True,
        proposal_updates=settings_data.proposal_updates or True,
        marketing_emails=settings_data.marketing_emails or False,
        preferred_currency=settings_data.preferred_currency or "USD",
        timezone=settings_data.timezone or "UTC",
    )


# ==================== User Statistics ====================

@router.get("/me/stats", response_model=UserStatsResponse)
async def get_user_stats(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get the current user's trading and activity statistics.
    """
    from app.db.models import RWAAsset, Trade, NostromoProposal
    from sqlalchemy import func
    
    # Count assets owned
    assets_count = (await session.execute(
        select(func.count()).select_from(RWAAsset).where(
            RWAAsset.owner_id == current_user.id
        )
    )).scalar() or 0
    
    # Count trades
    trades_count = (await session.execute(
        select(func.count()).select_from(Trade).where(
            Trade.user_id == current_user.id
        )
    )).scalar() or 0
    
    # Calculate total trade volume
    total_volume = (await session.execute(
        select(func.sum(Trade.total_amount)).where(
            Trade.user_id == current_user.id
        )
    )).scalar() or 0
    
    # Count proposals
    proposals_count = (await session.execute(
        select(func.count()).select_from(NostromoProposal).where(
            NostromoProposal.proposer_id == current_user.id
        )
    )).scalar() or 0
    
    return UserStatsResponse(
        total_assets_owned=assets_count,
        total_trades=trades_count,
        total_volume=float(total_volume) if total_volume else 0,
        total_proposals=proposals_count,
        member_since=current_user.created_at,
    )


# ==================== Clerk Webhook ====================

@router.post("/webhook/clerk", include_in_schema=False)
async def clerk_webhook(
    request: Request,
    session: AsyncSession = Depends(get_session),
):
    """
    Handle Clerk webhook events for user sync.
    
    Events: user.created, user.updated, user.deleted
    """
    # Verify webhook signature
    # svix_id = request.headers.get("svix-id")
    # svix_timestamp = request.headers.get("svix-timestamp")
    # svix_signature = request.headers.get("svix-signature")
    
    try:
        payload = await request.json()
        event_type = payload.get("type")
        data = payload.get("data", {})
        
        logger.info(f"Clerk webhook received: {event_type}")
        
        if event_type == "user.created":
            # Create new user
            user = User(
                clerk_id=data.get("id"),
                email=data.get("email_addresses", [{}])[0].get("email_address"),
                name=f"{data.get('first_name', '')} {data.get('last_name', '')}".strip(),
                avatar_url=data.get("image_url"),
            )
            session.add(user)
            await session.flush()
            logger.info(f"User created from webhook: {user.id}")
            
        elif event_type == "user.updated":
            # Update existing user
            result = await session.execute(
                select(User).where(User.clerk_id == data.get("id"))
            )
            user = result.scalar_one_or_none()
            
            if user:
                user.email = data.get("email_addresses", [{}])[0].get("email_address", user.email)
                user.name = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip() or user.name
                user.avatar_url = data.get("image_url") or user.avatar_url
                user.updated_at = datetime.utcnow()
                logger.info(f"User updated from webhook: {user.id}")
                
        elif event_type == "user.deleted":
            # Soft delete user (mark as inactive)
            result = await session.execute(
                select(User).where(User.clerk_id == data.get("id"))
            )
            user = result.scalar_one_or_none()
            
            if user:
                user.is_active = False
                user.updated_at = datetime.utcnow()
                logger.info(f"User deleted from webhook: {user.id}")
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"Clerk webhook error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook processing failed"
        )


# ==================== Admin Endpoints ====================

@router.get("/{user_id}", response_model=UserProfile)
async def get_user_by_id(
    user_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get a user by ID (admin only or self).
    """
    if user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user"
        )
    
    result = await session.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserProfile(
        id=user.id,
        clerk_id=user.clerk_id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        qubic_public_key=user.qubic_public_key,
        is_verified=user.is_verified,
        is_admin=user.is_admin,
        created_at=user.created_at,
        wallet_connected=bool(user.qubic_public_key),
    )
