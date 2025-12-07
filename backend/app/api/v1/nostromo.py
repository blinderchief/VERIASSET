"""
Nostromo Launchpad API Routes
Endpoints for proposals, voting, and Dutch Auction IPO
"""

from typing import List, Optional
from datetime import datetime, timedelta
import math

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.database import get_session
from app.db.models import (
    NostromoProposal, RWAAsset, User,
    ProposalStatus, VerificationStatus
)
from app.models.nostromo import (
    ProposalCreate,
    ProposalResponse,
    ProposalListResponse,
    ProposalVoteRequest,
    ProposalVoteResponse,
    DutchAuctionIPO,
    IPOBidRequest,
    IPOBidResponse,
    IPOStatus,
    LaunchpadStats,
)
from app.services.qubic_rpc import QubicRPCClient
from app.services.nostromo import NostromoService, get_nostromo_service
from app.services.easyconnect import EasyConnectService, get_easyconnect_service
from app.api.v1.deps import get_current_user
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/nostromo", tags=["Nostromo Launchpad"])


# ==================== Proposals ====================

@router.post("/proposals", response_model=ProposalResponse, status_code=status.HTTP_201_CREATED)
async def create_proposal(
    proposal_data: ProposalCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new Nostromo proposal for RWA listing.
    
    Proposals require community voting before proceeding to IPO.
    """
    # Get asset
    result = await session.execute(
        select(RWAAsset).where(RWAAsset.id == proposal_data.asset_id)
    )
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    if asset.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only asset owner can create proposal"
        )
    
    if asset.verification_score < 80:  # Require 80% verification score
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Asset must have at least 80% verification score before creating proposal"
        )
    
    # Check for existing active proposal
    existing = await session.execute(
        select(NostromoProposal).where(
            NostromoProposal.asset_id == proposal_data.asset_id,
            NostromoProposal.status.in_([ProposalStatus.DRAFT, ProposalStatus.SUBMITTED, ProposalStatus.VOTING])
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active proposal already exists for this asset"
        )
    
    # Calculate voting period (7 days by default)
    voting_ends_at = datetime.utcnow() + timedelta(days=proposal_data.voting_duration_days)
    
    # Create proposal
    proposal = NostromoProposal(
        asset_id=proposal_data.asset_id,
        title=proposal_data.title,
        description=proposal_data.description,
        ipo_total_shares=proposal_data.token_allocation,
        ipo_start_price=proposal_data.ipo_start_price,
        ipo_end_price=proposal_data.ipo_reserve_price,
        status=ProposalStatus.VOTING,
        votes_for=0,
        votes_against=0,
        voting_deadline=voting_ends_at,
    )
    
    session.add(proposal)
    await session.flush()
    
    # Register with Nostromo service
    try:
        async with get_nostromo_service() as nostromo:
            await nostromo.create_proposal(
                proposal_id=proposal.id,
                asset_id=asset.id,
                title=proposal.title,
                token_allocation=proposal.ipo_total_shares,
            )
    except Exception as e:
        logger.warning(f"Failed to register with Nostromo service: {e}")
    
    logger.info(f"Proposal created: {proposal.id} for asset {asset.name}")
    
    return ProposalResponse.model_validate(proposal)


@router.get("/proposals", response_model=ProposalListResponse)
async def list_proposals(
    session: AsyncSession = Depends(get_session),
    status_filter: Optional[ProposalStatus] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """
    List all Nostromo proposals.
    """
    query = select(NostromoProposal)
    
    if status_filter:
        query = query.where(NostromoProposal.status == status_filter)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar() or 0
    
    # Apply pagination
    query = query.order_by(NostromoProposal.created_at.desc())
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    result = await session.execute(query)
    proposals = result.scalars().all()
    
    return ProposalListResponse(
        items=[ProposalResponse.model_validate(p) for p in proposals],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/proposals/{proposal_id}", response_model=ProposalResponse)
async def get_proposal(
    proposal_id: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Get details of a specific proposal.
    """
    result = await session.execute(
        select(NostromoProposal).where(NostromoProposal.id == proposal_id)
    )
    proposal = result.scalar_one_or_none()
    
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )
    
    return ProposalResponse.model_validate(proposal)


# ==================== Voting ====================

@router.post("/proposals/{proposal_id}/vote", response_model=ProposalVoteResponse)
async def vote_on_proposal(
    proposal_id: str,
    vote_data: ProposalVoteRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Vote on a Nostromo proposal.
    
    Voting power is determined by VERI token holdings.
    """
    result = await session.execute(
        select(NostromoProposal).where(NostromoProposal.id == proposal_id)
    )
    proposal = result.scalar_one_or_none()
    
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )
    
    if proposal.status != ProposalStatus.VOTING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Proposal is not in voting phase (status: {proposal.status.value})"
        )
    
    if proposal.voting_deadline and datetime.utcnow() > proposal.voting_deadline:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voting period has ended"
        )
    
    # Check voting power (simplified - would check VERI balance)
    voting_power = vote_data.voting_power or 1  # Default to 1 for demo
    
    # Record vote
    try:
        async with get_nostromo_service() as nostromo:
            result = await nostromo.submit_vote(
                proposal_id=proposal.id,
                voter_address=current_user.qubic_public_key or f"user_{current_user.id}",
                vote_for=vote_data.vote_for,
                voting_power=voting_power,
            )
            
            # Update proposal counts
            if vote_data.vote_for:
                proposal.votes_for += voting_power
            else:
                proposal.votes_against += voting_power
            
            logger.info(
                f"Vote recorded: {proposal_id} - "
                f"{'FOR' if vote_data.vote_for else 'AGAINST'} "
                f"(power: {voting_power})"
            )
            
            return ProposalVoteResponse(
                proposal_id=proposal.id,
                voted_for=vote_data.vote_for,
                voting_power=voting_power,
                current_votes_for=proposal.votes_for,
                current_votes_against=proposal.votes_against,
                message="Vote recorded successfully",
            )
            
    except Exception as e:
        logger.error(f"Vote submission failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record vote: {str(e)}"
        )


# ==================== Dutch Auction IPO ====================

@router.post("/proposals/{proposal_id}/start-ipo", response_model=DutchAuctionIPO)
async def start_dutch_auction_ipo(
    proposal_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Start a Dutch Auction IPO for an approved proposal.
    
    The price decreases over time from start_price to reserve_price.
    """
    result = await session.execute(
        select(NostromoProposal).where(NostromoProposal.id == proposal_id)
    )
    proposal = result.scalar_one_or_none()
    
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )
    
    # Get asset to check ownership
    result = await session.execute(
        select(RWAAsset).where(RWAAsset.id == proposal.asset_id)
    )
    asset = result.scalar_one_or_none()
    
    if not asset or asset.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only asset owner can start IPO"
        )
    
    if proposal.status != ProposalStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Proposal must be approved to start IPO (current: {proposal.status.value})"
        )
    
    # Start IPO
    try:
        async with get_nostromo_service() as nostromo:
            ipo_result = await nostromo.start_dutch_auction(
                proposal_id=proposal.id,
                start_price=proposal.ipo_start_price,
                reserve_price=proposal.ipo_end_price,
                token_allocation=proposal.ipo_total_shares,
            )
            
            # Update proposal status
            proposal.status = ProposalStatus.IPO_ACTIVE
            proposal.ipo_start_time = datetime.utcnow()
            proposal.ipo_end_time = datetime.utcnow() + timedelta(hours=24)  # 24h auction
            
            # EasyConnect notification
            try:
                async with get_easyconnect_service() as ec:
                    await ec.notify_ipo_started(
                        proposal_id=proposal.id,
                        asset_id=asset.id,
                        asset_name=asset.name,
                        start_price=proposal.ipo_start_price,
                        reserve_price=proposal.ipo_end_price,
                        token_allocation=proposal.ipo_total_shares,
                        duration_hours=24,
                    )
            except Exception as e:
                logger.warning(f"Failed to send IPO notification: {e}")
            
            logger.info(f"Dutch Auction IPO started: {proposal_id}")
            
            return DutchAuctionIPO(
                proposal_id=proposal.id,
                asset_id=asset.id,
                asset_name=asset.name,
                symbol=asset.symbol,
                start_price=proposal.ipo_start_price,
                current_price=proposal.ipo_start_price,
                reserve_price=proposal.ipo_end_price,
                token_allocation=proposal.ipo_total_shares,
                tokens_remaining=proposal.ipo_total_shares,
                started_at=proposal.ipo_start_time,
                ends_at=proposal.ipo_end_time,
                status=IPOStatus.ACTIVE,
            )
            
    except Exception as e:
        logger.error(f"Failed to start IPO: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start IPO: {str(e)}"
        )


@router.get("/ipo/{proposal_id}", response_model=DutchAuctionIPO)
async def get_ipo_status(
    proposal_id: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Get current Dutch Auction IPO status and price.
    """
    result = await session.execute(
        select(NostromoProposal).where(NostromoProposal.id == proposal_id)
    )
    proposal = result.scalar_one_or_none()
    
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )
    
    if proposal.status not in [ProposalStatus.IPO_ACTIVE, ProposalStatus.IPO_COMPLETED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No IPO found for this proposal"
        )
    
    # Get asset
    result = await session.execute(
        select(RWAAsset).where(RWAAsset.id == proposal.asset_id)
    )
    asset = result.scalar_one_or_none()
    
    # Calculate current Dutch Auction price
    current_price = proposal.ipo_start_price or 0
    tokens_remaining = proposal.ipo_total_shares or 0
    ipo_status = IPOStatus.ACTIVE if proposal.status == ProposalStatus.IPO_ACTIVE else IPOStatus.COMPLETED
    
    if proposal.ipo_start_time and proposal.ipo_end_time:
        total_duration = (proposal.ipo_end_time - proposal.ipo_start_time).total_seconds()
        elapsed = (datetime.utcnow() - proposal.ipo_start_time).total_seconds()
        elapsed = max(0, min(elapsed, total_duration))
        
        # Linear price decay
        reserve_price = proposal.ipo_end_price or 0
        price_range = (proposal.ipo_start_price or 0) - reserve_price
        price_decay = price_range * (elapsed / total_duration) if total_duration > 0 else 0
        current_price = (proposal.ipo_start_price or 0) - price_decay
        current_price = max(current_price, reserve_price)
        
        # Get actual remaining from service
        try:
            async with get_nostromo_service() as nostromo:
                ipo_status = await nostromo.get_ipo_status(proposal.id)
                if ipo_status.get("tokens_remaining"):
                    tokens_remaining = ipo_status["tokens_remaining"]
        except Exception:
            pass
    
    return DutchAuctionIPO(
        proposal_id=proposal.id,
        asset_id=asset.id if asset else "",
        asset_name=asset.name if asset else "",
        symbol=asset.symbol if asset else "",
        start_price=proposal.ipo_start_price or 0,
        current_price=current_price,
        reserve_price=proposal.ipo_end_price or 0,
        token_allocation=proposal.ipo_total_shares or 0,
        tokens_remaining=tokens_remaining,
        started_at=proposal.ipo_start_time,
        ends_at=proposal.ipo_end_time,
        status=ipo_status,
    )


@router.post("/ipo/{proposal_id}/bid", response_model=IPOBidResponse)
async def place_ipo_bid(
    proposal_id: str,
    bid_data: IPOBidRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Place a bid in the Dutch Auction IPO.
    
    Bid is executed at current price if sufficient funds.
    """
    result = await session.execute(
        select(NostromoProposal).where(NostromoProposal.id == proposal_id)
    )
    proposal = result.scalar_one_or_none()
    
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )
    
    if proposal.status != ProposalStatus.IPO_ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="IPO is not active"
        )
    
    # Get current price
    ipo_status = await get_ipo_status(proposal_id, session)
    current_price = ipo_status.current_price
    
    # Check if bid meets current price
    if bid_data.max_price < current_price:
        return IPOBidResponse(
            proposal_id=proposal.id,
            status="rejected",
            message=f"Bid price {bid_data.max_price} below current price {current_price}",
            tokens_received=0,
            price_paid=0,
        )
    
    # Execute bid
    try:
        async with get_nostromo_service() as nostromo:
            bid_result = await nostromo.execute_ipo_bid(
                proposal_id=proposal.id,
                bidder_address=current_user.qubic_public_key or f"user_{current_user.id}",
                quantity=bid_data.quantity,
                max_price=bid_data.max_price,
            )
            
            tokens_received = min(bid_data.quantity, ipo_status.tokens_remaining)
            total_cost = tokens_received * current_price
            
            logger.info(
                f"IPO bid executed: {proposal_id} - "
                f"{tokens_received} tokens @ {current_price} QUBIC"
            )
            
            # EasyConnect notification
            try:
                async with get_easyconnect_service() as ec:
                    result = await session.execute(
                        select(RWAAsset).where(RWAAsset.id == proposal.asset_id)
                    )
                    asset = result.scalar_one_or_none()
                    
                    await ec.notify_ipo_participation(
                        proposal_id=proposal.id,
                        asset_id=asset.id,
                        asset_name=asset.name,
                        bidder_address=current_user.qubic_public_key or "unknown",
                        tokens_received=tokens_received,
                        price_paid=total_cost,
                        current_ipo_price=current_price,
                    )
            except Exception as e:
                logger.warning(f"Failed to send IPO bid notification: {e}")
            
            return IPOBidResponse(
                proposal_id=proposal.id,
                status="executed",
                tokens_received=tokens_received,
                price_paid=total_cost,
                execution_price=current_price,
                qubic_tx_hash=bid_result.get("tx_hash"),
                message=f"Successfully purchased {tokens_received} tokens",
            )
            
    except Exception as e:
        logger.error(f"IPO bid failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute bid: {str(e)}"
        )


# ==================== Launchpad Stats ====================

@router.get("/stats", response_model=LaunchpadStats)
async def get_launchpad_stats(
    session: AsyncSession = Depends(get_session),
):
    """
    Get overall Nostromo launchpad statistics.
    """
    # Count proposals by status
    total_proposals = (await session.execute(
        select(func.count()).select_from(NostromoProposal)
    )).scalar() or 0
    
    active_ipos = (await session.execute(
        select(func.count()).select_from(NostromoProposal).where(
            NostromoProposal.status == ProposalStatus.IPO_ACTIVE
        )
    )).scalar() or 0
    
    completed_ipos = (await session.execute(
        select(func.count()).select_from(NostromoProposal).where(
            NostromoProposal.status == ProposalStatus.IPO_COMPLETED
        )
    )).scalar() or 0
    
    pending_votes = (await session.execute(
        select(func.count()).select_from(NostromoProposal).where(
            NostromoProposal.status == ProposalStatus.VOTING
        )
    )).scalar() or 0
    
    # Calculate totals
    total_raised = (await session.execute(
        select(func.sum(NostromoProposal.total_raised)).where(
            NostromoProposal.status == ProposalStatus.IPO_COMPLETED
        )
    )).scalar() or 0
    
    total_votes = (await session.execute(
        select(
            func.sum(NostromoProposal.votes_for + NostromoProposal.votes_against)
        )
    )).scalar() or 0
    
    return LaunchpadStats(
        total_proposals=total_proposals,
        active_ipos=active_ipos,
        completed_ipos=completed_ipos,
        pending_votes=pending_votes,
        total_raised=float(total_raised) if total_raised else 0,
        total_votes=int(total_votes) if total_votes else 0,
        average_funding_success_rate=(
            completed_ipos / total_proposals * 100 if total_proposals > 0 else 0
        ),
    )


@router.get("/active-ipos", response_model=List[DutchAuctionIPO])
async def list_active_ipos(
    session: AsyncSession = Depends(get_session),
):
    """
    List all currently active Dutch Auction IPOs.
    """
    result = await session.execute(
        select(NostromoProposal).where(
            NostromoProposal.status == ProposalStatus.IPO_ACTIVE
        ).order_by(NostromoProposal.ipo_end_time.asc())
    )
    proposals = result.scalars().all()
    
    ipos = []
    for proposal in proposals:
        ipo = await get_ipo_status(proposal.id, session)
        ipos.append(ipo)
    
    return ipos
