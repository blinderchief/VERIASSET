"""
Nostromo Launchpad Integration Service
Handles proposal submissions, voting tracking, and IPO management
"""

from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
from app.core.config import settings
from app.core.logging import get_logger
from app.services.qubic_rpc import QubicRPCClient
from app.db.models import ProposalStatus

logger = get_logger(__name__)


class NostromoError(Exception):
    """Custom exception for Nostromo operations"""
    def __init__(self, message: str, details: Optional[Dict] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class NostromoService:
    """
    Nostromo Launchpad Integration Service.
    
    Handles:
    - Proposal creation and submission
    - Quorum voting tracking (451/676 computors)
    - Dutch auction IPO management
    - Share distribution
    """
    
    # Quorum requirements
    TOTAL_COMPUTORS = 676
    QUORUM_REQUIRED = 451  # Minimum votes needed
    VOTING_PERIOD_DAYS = 7
    
    # IPO defaults (Dutch auction)
    DEFAULT_IPO_DURATION_DAYS = 7
    DEFAULT_PRICE_DECAY_RATE = 0.1  # 10% per day
    
    def __init__(self, qubic_client: Optional[QubicRPCClient] = None):
        self.qubic_client = qubic_client
    
    async def _get_qubic_client(self) -> QubicRPCClient:
        """Get or create Qubic client"""
        if self.qubic_client:
            return self.qubic_client
        return QubicRPCClient()
    
    async def create_proposal(
        self,
        asset_id: str,
        title: str,
        description: str,
        creator_address: str,
        ipo_config: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Create a new Nostromo proposal for an RWA asset.
        
        Args:
            asset_id: VeriAssets asset ID
            title: Proposal title
            description: Detailed proposal description
            creator_address: Qubic address of the creator
            ipo_config: Optional IPO configuration
        
        Returns:
            Proposal creation result
        """
        # Calculate voting deadline
        voting_deadline = datetime.utcnow() + timedelta(days=self.VOTING_PERIOD_DAYS)
        
        # Default IPO configuration
        default_ipo = {
            "start_price": 100.0,  # QUBIC per share
            "end_price": 10.0,     # Minimum price
            "total_shares": 10000,
            "duration_days": self.DEFAULT_IPO_DURATION_DAYS,
        }
        
        ipo_settings = {**default_ipo, **(ipo_config or {})}
        
        # Create proposal structure
        proposal = {
            "asset_id": asset_id,
            "title": title,
            "description": description,
            "creator_address": creator_address,
            "status": ProposalStatus.DRAFT.value,
            "voting_deadline": voting_deadline.isoformat(),
            "quorum_required": self.QUORUM_REQUIRED,
            "votes_for": 0,
            "votes_against": 0,
            "ipo_config": ipo_settings,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        logger.info(f"Created proposal for asset {asset_id}: {title}")
        return proposal
    
    async def submit_proposal(
        self,
        proposal_id: str,
        proposal_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Submit a proposal to the Qubic network for voting.
        
        In production, this would create an on-chain proposal.
        For hackathon demo, we simulate the submission.
        """
        # Simulate proposal submission
        # In production: Create transaction to proposal contract
        
        submission_result = {
            "proposal_id": proposal_id,
            "status": ProposalStatus.SUBMITTED.value,
            "submitted_at": datetime.utcnow().isoformat(),
            "qubic_proposal_id": f"QP-{proposal_id[:8].upper()}",
            "voting_opens": datetime.utcnow().isoformat(),
            "voting_closes": proposal_data.get("voting_deadline"),
            "message": "Proposal submitted to Nostromo for Quorum voting",
        }
        
        logger.info(f"Submitted proposal {proposal_id} to Nostromo")
        return submission_result
    
    async def get_proposal_status(
        self,
        qubic_proposal_id: str,
    ) -> Dict[str, Any]:
        """
        Get the current status of a proposal including vote counts.
        
        In production, this would query the Qubic network.
        """
        # Simulate vote status retrieval
        # In production: Query proposal contract state
        
        status = {
            "qubic_proposal_id": qubic_proposal_id,
            "votes_for": 320,  # Simulated
            "votes_against": 45,  # Simulated
            "total_votes": 365,
            "quorum_reached": False,
            "approval_percentage": 87.7,
            "remaining_time_hours": 48,
            "status": ProposalStatus.VOTING.value,
        }
        
        return status
    
    async def check_quorum(
        self,
        votes_for: int,
        votes_against: int,
    ) -> Dict[str, Any]:
        """
        Check if a proposal has reached quorum and its result.
        
        Args:
            votes_for: Number of votes in favor
            votes_against: Number of votes against
        
        Returns:
            Quorum check result
        """
        total_votes = votes_for + votes_against
        quorum_reached = total_votes >= self.QUORUM_REQUIRED
        
        if quorum_reached:
            # More than 50% must vote for approval
            approval_threshold = total_votes / 2
            approved = votes_for > approval_threshold
        else:
            approved = False
        
        return {
            "total_votes": total_votes,
            "quorum_required": self.QUORUM_REQUIRED,
            "quorum_reached": quorum_reached,
            "votes_for": votes_for,
            "votes_against": votes_against,
            "approval_percentage": (votes_for / total_votes * 100) if total_votes > 0 else 0,
            "approved": approved,
            "status": (
                ProposalStatus.APPROVED.value if approved
                else (ProposalStatus.REJECTED.value if quorum_reached else ProposalStatus.VOTING.value)
            ),
        }
    
    # ==================== IPO (Dutch Auction) Management ====================
    
    def calculate_current_ipo_price(
        self,
        start_price: float,
        end_price: float,
        start_time: datetime,
        duration_days: int,
        current_time: Optional[datetime] = None,
    ) -> float:
        """
        Calculate the current IPO price based on Dutch auction mechanics.
        
        Price decreases linearly from start_price to end_price over the duration.
        """
        current = current_time or datetime.utcnow()
        elapsed = (current - start_time).total_seconds()
        total_duration = duration_days * 24 * 60 * 60
        
        if elapsed <= 0:
            return start_price
        if elapsed >= total_duration:
            return end_price
        
        # Linear decay
        price_range = start_price - end_price
        progress = elapsed / total_duration
        current_price = start_price - (price_range * progress)
        
        return round(current_price, 2)
    
    async def start_ipo(
        self,
        proposal_id: str,
        ipo_config: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Start a Dutch auction IPO for an approved proposal.
        """
        start_time = datetime.utcnow()
        duration_days = ipo_config.get("duration_days", self.DEFAULT_IPO_DURATION_DAYS)
        end_time = start_time + timedelta(days=duration_days)
        
        ipo_details = {
            "proposal_id": proposal_id,
            "status": ProposalStatus.IPO_ACTIVE.value,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "start_price": ipo_config["start_price"],
            "end_price": ipo_config.get("end_price", ipo_config["start_price"] * 0.1),
            "current_price": ipo_config["start_price"],
            "total_shares": ipo_config["total_shares"],
            "shares_sold": 0,
            "shares_remaining": ipo_config["total_shares"],
            "total_raised": 0.0,
        }
        
        logger.info(f"Started IPO for proposal {proposal_id}")
        return ipo_details
    
    async def participate_in_ipo(
        self,
        proposal_id: str,
        buyer_address: str,
        shares_to_buy: int,
        max_price_per_share: float,
        ipo_state: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Process a participation in the Dutch auction IPO.
        """
        # Calculate current price
        current_price = self.calculate_current_ipo_price(
            ipo_state["start_price"],
            ipo_state["end_price"],
            datetime.fromisoformat(ipo_state["start_time"]),
            ipo_state.get("duration_days", self.DEFAULT_IPO_DURATION_DAYS),
        )
        
        # Check if buyer's max price is acceptable
        if max_price_per_share < current_price:
            return {
                "success": False,
                "error": "Max price below current auction price",
                "current_price": current_price,
                "your_max_price": max_price_per_share,
            }
        
        # Check available shares
        available = ipo_state["shares_remaining"]
        actual_shares = min(shares_to_buy, available)
        
        if actual_shares <= 0:
            return {
                "success": False,
                "error": "No shares available",
            }
        
        # Calculate total cost
        total_cost = actual_shares * current_price
        
        # In production: Create purchase transaction
        
        result = {
            "success": True,
            "buyer_address": buyer_address,
            "shares_purchased": actual_shares,
            "price_per_share": current_price,
            "total_cost": total_cost,
            "shares_remaining": available - actual_shares,
            "purchased_at": datetime.utcnow().isoformat(),
        }
        
        logger.info(
            f"IPO participation: {buyer_address[:16]}... bought {actual_shares} shares at {current_price} QUBIC"
        )
        return result
    
    async def finalize_ipo(
        self,
        proposal_id: str,
        ipo_state: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Finalize an IPO and distribute results.
        """
        total_raised = ipo_state.get("total_raised", 0)
        shares_sold = ipo_state.get("shares_sold", 0)
        
        # Calculate final price (average or last price)
        final_price = (
            total_raised / shares_sold if shares_sold > 0
            else ipo_state["end_price"]
        )
        
        finalization = {
            "proposal_id": proposal_id,
            "status": ProposalStatus.IPO_COMPLETED.value,
            "final_price": final_price,
            "total_shares_sold": shares_sold,
            "total_raised": total_raised,
            "finalized_at": datetime.utcnow().isoformat(),
            "distribution_status": "pending",
        }
        
        logger.info(
            f"Finalized IPO for {proposal_id}: {shares_sold} shares, {total_raised} QUBIC raised"
        )
        return finalization


# Service factory
def get_nostromo_service(qubic_client: Optional[QubicRPCClient] = None) -> NostromoService:
    """Get Nostromo service instance"""
    return NostromoService(qubic_client)
