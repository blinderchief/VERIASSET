"""
RWA Assets API Routes
Endpoints for creating, managing, and verifying Real-World Assets
"""

from typing import List, Optional
from datetime import datetime
import hashlib

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.db.database import get_session
from app.db.models import (
    RWAAsset, 
    User, 
    Verification,
    AssetType, 
    AssetStatus, 
    VerificationStatus,
)
from app.models.rwa import (
    AssetCreate,
    AssetUpdate,
    AssetResponse,
    AssetListResponse,
    AssetDetailResponse,
    VerificationRequest,
    VerificationResponse,
    AssetFilters,
    PaginationParams,
)
from app.services.gemini_ai import GeminiAIService, get_gemini_service
from app.services.easyconnect import EasyConnectService, get_easyconnect_service
from app.services.qubic_rpc import QubicRPCClient
from app.core.logging import get_logger
from app.api.v1.deps import get_current_user

logger = get_logger(__name__)

router = APIRouter(prefix="/rwa", tags=["RWA Assets"])


# ==================== Asset CRUD ====================

@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(
    asset_data: AssetCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new RWA asset.
    
    The asset will be in DRAFT status until verification is complete.
    """
    # Check for duplicate symbol
    existing = await session.execute(
        select(RWAAsset).where(RWAAsset.symbol == asset_data.symbol)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Asset with symbol {asset_data.symbol} already exists"
        )
    
    # Create asset
    asset = RWAAsset(
        name=asset_data.name,
        symbol=asset_data.symbol,
        description=asset_data.description,
        asset_type=asset_data.asset_type,
        status=AssetStatus.DRAFT,
        creator_id=current_user.id,
        total_supply=asset_data.total_supply,
        circulating_supply=0,
        price_per_unit=asset_data.price_per_unit,
        image_url=asset_data.image_url,
        document_urls=asset_data.document_urls,
        external_data_sources=asset_data.external_data_sources,
        metadata=asset_data.metadata,
    )
    
    session.add(asset)
    await session.flush()
    
    logger.info(f"Created RWA asset: {asset.id} ({asset.symbol})")
    
    return AssetResponse.model_validate(asset)


@router.get("", response_model=AssetListResponse)
async def list_assets(
    session: AsyncSession = Depends(get_session),
    # Filters
    asset_type: Optional[AssetType] = Query(None, description="Filter by asset type"),
    status_filter: Optional[AssetStatus] = Query(None, alias="status", description="Filter by status"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    min_verification_score: Optional[float] = Query(None, ge=0, le=100, description="Minimum verification score"),
    creator_id: Optional[str] = Query(None, description="Filter by creator"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    # Pagination
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
):
    """
    List RWA assets with filtering and pagination.
    """
    # Build query
    query = select(RWAAsset)
    
    # Apply filters
    if asset_type:
        query = query.where(RWAAsset.asset_type == asset_type)
    if status_filter:
        query = query.where(RWAAsset.status == status_filter)
    if min_price is not None:
        query = query.where(RWAAsset.price_per_unit >= min_price)
    if max_price is not None:
        query = query.where(RWAAsset.price_per_unit <= max_price)
    if min_verification_score is not None:
        query = query.where(RWAAsset.verification_score >= min_verification_score)
    if creator_id:
        query = query.where(RWAAsset.creator_id == creator_id)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                RWAAsset.name.ilike(search_term),
                RWAAsset.description.ilike(search_term),
                RWAAsset.symbol.ilike(search_term),
            )
        )
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar() or 0
    
    # Apply sorting
    sort_column = getattr(RWAAsset, sort_by, RWAAsset.created_at)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute
    result = await session.execute(query)
    assets = result.scalars().all()
    
    return AssetListResponse(
        items=[AssetResponse.model_validate(a) for a in assets],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/{asset_id}", response_model=AssetDetailResponse)
async def get_asset(
    asset_id: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Get detailed information about a specific asset.
    """
    result = await session.execute(
        select(RWAAsset).where(RWAAsset.id == asset_id)
    )
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    return AssetDetailResponse.model_validate(asset)


@router.patch("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: str,
    update_data: AssetUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Update an RWA asset. Only the creator can update their asset.
    """
    result = await session.execute(
        select(RWAAsset).where(RWAAsset.id == asset_id)
    )
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    if asset.creator_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this asset"
        )
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(asset, field, value)
    
    asset.updated_at = datetime.utcnow()
    
    return AssetResponse.model_validate(asset)


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    asset_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Delete an RWA asset. Only drafts can be deleted.
    """
    result = await session.execute(
        select(RWAAsset).where(RWAAsset.id == asset_id)
    )
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    if asset.creator_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this asset"
        )
    
    if asset.status != AssetStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft assets can be deleted"
        )
    
    await session.delete(asset)


# ==================== AI Verification ====================

@router.post("/{asset_id}/verify", response_model=VerificationResponse)
async def verify_asset(
    asset_id: str,
    verification_data: VerificationRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Request AI verification for an RWA asset.
    
    This triggers Gemini AI analysis and generates an oracle proof.
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
    
    if asset.creator_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to verify this asset"
        )
    
    # Update asset status
    asset.status = AssetStatus.PENDING_VERIFICATION
    
    # Run AI verification
    gemini = get_gemini_service()
    
    try:
        ai_result, input_hash = await gemini.verify_asset(
            asset_type=asset.asset_type,
            data=verification_data.input_data,
            additional_context=verification_data.additional_context,
        )
        
        # Generate proof hash
        proof_hash = hashlib.sha256(
            f"{input_hash}:{ai_result['timestamp']}:{ai_result['confidence']}".encode()
        ).hexdigest()
        
        # Create verification record
        verification = Verification(
            asset_id=asset_id,
            status=(
                VerificationStatus.VERIFIED 
                if ai_result.get("verified") and ai_result.get("confidence", 0) >= 0.7
                else VerificationStatus.FAILED
            ),
            verification_type=verification_data.verification_type,
            input_data=verification_data.input_data,
            input_hash=input_hash,
            ai_model=ai_result.get("model", "gemini-1.5-flash"),
            ai_response=ai_result,
            confidence_score=ai_result.get("confidence", 0) * 100,  # Convert to percentage
            summary=ai_result.get("summary"),
            issues=ai_result.get("issues", []),
            proof_hash=proof_hash,
            processing_time_ms=ai_result.get("processing_time_ms", 0),
        )
        
        session.add(verification)
        
        # Update asset verification data
        asset.verification_score = ai_result.get("confidence", 0) * 100
        asset.verification_data = ai_result.get("scores", {})
        asset.verification_hash = proof_hash
        
        if ai_result.get("verified") and ai_result.get("confidence", 0) >= 0.7:
            asset.status = AssetStatus.VERIFIED
            
            # Send EasyConnect notification
            try:
                async with get_easyconnect_service() as ec:
                    await ec.notify_rwa_verified(
                        asset_id=asset_id,
                        asset_name=asset.name,
                        asset_type=asset.asset_type.value,
                        verification_score=ai_result.get("confidence", 0),
                        creator_email=current_user.email,
                    )
            except Exception as e:
                logger.warning(f"Failed to send EasyConnect notification: {e}")
        else:
            asset.status = AssetStatus.REJECTED
            
            # Notify about failed verification
            try:
                async with get_easyconnect_service() as ec:
                    await ec.notify_verification_failed(
                        asset_id=asset_id,
                        asset_name=asset.name,
                        issues=ai_result.get("issues", []),
                        creator_email=current_user.email,
                    )
            except Exception as e:
                logger.warning(f"Failed to send EasyConnect notification: {e}")
        
        await session.flush()
        
        logger.info(
            f"Verification complete for {asset_id}: "
            f"verified={ai_result.get('verified')}, confidence={ai_result.get('confidence')}"
        )
        
        return VerificationResponse.model_validate(verification)
        
    except Exception as e:
        logger.error(f"Verification failed for {asset_id}: {e}")
        
        # Create failed verification record
        verification = Verification(
            asset_id=asset_id,
            status=VerificationStatus.FAILED,
            verification_type=verification_data.verification_type,
            input_data=verification_data.input_data,
            input_hash=hashlib.sha256(str(verification_data.input_data).encode()).hexdigest(),
            error_message=str(e),
        )
        session.add(verification)
        
        asset.status = AssetStatus.REJECTED
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification failed: {str(e)}"
        )


@router.get("/{asset_id}/verifications", response_model=List[VerificationResponse])
async def get_asset_verifications(
    asset_id: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Get all verifications for an asset.
    """
    result = await session.execute(
        select(Verification)
        .where(Verification.asset_id == asset_id)
        .order_by(Verification.created_at.desc())
    )
    verifications = result.scalars().all()
    
    return [VerificationResponse.model_validate(v) for v in verifications]


# ==================== Asset Status Management ====================

@router.post("/{asset_id}/list", response_model=AssetResponse)
async def list_asset_for_trading(
    asset_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    List a verified asset for trading on the marketplace.
    """
    result = await session.execute(
        select(RWAAsset).where(RWAAsset.id == asset_id)
    )
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    if asset.creator_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    if asset.status != AssetStatus.VERIFIED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only verified assets can be listed"
        )
    
    asset.status = AssetStatus.LISTED
    asset.updated_at = datetime.utcnow()
    
    logger.info(f"Asset {asset_id} listed for trading")
    
    return AssetResponse.model_validate(asset)


@router.get("/types", response_model=List[dict])
async def get_asset_types():
    """
    Get available asset types with descriptions.
    """
    return [
        {
            "value": AssetType.CARBON_CREDIT.value,
            "label": "Carbon Credit",
            "description": "Verified carbon offset credits from reforestation, renewable energy, etc.",
            "icon": "🌱"
        },
        {
            "value": AssetType.TREASURY.value,
            "label": "Treasury",
            "description": "Government bonds and treasury instruments",
            "icon": "🏛️"
        },
        {
            "value": AssetType.REAL_ESTATE.value,
            "label": "Real Estate",
            "description": "Tokenized real estate and property assets",
            "icon": "🏠"
        },
        {
            "value": AssetType.COMMODITY.value,
            "label": "Commodity",
            "description": "Physical commodities like gold, silver, oil, etc.",
            "icon": "⚡"
        },
        {
            "value": AssetType.INTELLECTUAL_PROPERTY.value,
            "label": "Intellectual Property",
            "description": "Patents, trademarks, and other IP assets",
            "icon": "💡"
        },
        {
            "value": AssetType.ART.value,
            "label": "Art",
            "description": "Fine art and collectible artworks",
            "icon": "🎨"
        },
        {
            "value": AssetType.COLLECTIBLE.value,
            "label": "Collectible",
            "description": "Rare collectibles, vintage items, etc.",
            "icon": "💎"
        },
        {
            "value": AssetType.OTHER.value,
            "label": "Other",
            "description": "Other real-world assets",
            "icon": "📦"
        },
    ]
