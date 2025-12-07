"""
EasyConnect Service for Webhook Integration
Sends events to Make.com/Zapier for no-code automation workflows
"""

import json
import hashlib
import hmac
from typing import Any, Dict, Optional
from datetime import datetime
import httpx
from app.core.config import settings
from app.core.logging import get_logger
from app.db.models import EasyConnectEvent

logger = get_logger(__name__)


class EasyConnectError(Exception):
    """Custom exception for EasyConnect errors"""
    def __init__(self, message: str, status_code: int = 500, details: Optional[Dict] = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class EasyConnectService:
    """
    EasyConnect Service for sending blockchain events to automation platforms.
    Supports Make.com and Zapier webhooks.
    """
    
    # Event types
    EVENT_TYPES = {
        "RWA_CREATED": "rwa_created",
        "RWA_VERIFIED": "rwa_verified",
        "RWA_LISTED": "rwa_listed",
        "TRADE_COMPLETED": "trade_completed",
        "TRADE_MILESTONE": "trade_milestone",
        "PROPOSAL_SUBMITTED": "proposal_submitted",
        "PROPOSAL_APPROVED": "proposal_approved",
        "IPO_STARTED": "ipo_started",
        "IPO_COMPLETED": "ipo_completed",
        "VERIFICATION_FAILED": "verification_failed",
        "AIRDROP_TRIGGERED": "airdrop_triggered",
    }
    
    # Milestone thresholds for trade notifications
    TRADE_MILESTONES = [100, 500, 1000, 5000, 10000, 50000, 100000]
    
    def __init__(self):
        self.webhook_url = settings.easyconnect_webhook_url
        self.secret = settings.easyconnect_secret
        self._client: Optional[httpx.AsyncClient] = None
    
    async def __aenter__(self):
        self._client = httpx.AsyncClient(timeout=httpx.Timeout(30.0))
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._client:
            await self._client.aclose()
    
    @property
    def client(self) -> httpx.AsyncClient:
        if not self._client:
            raise RuntimeError("Client not initialized. Use async context manager.")
        return self._client
    
    def _generate_signature(self, payload: str) -> str:
        """Generate HMAC signature for webhook payload"""
        return hmac.new(
            self.secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
    
    async def send_event(
        self,
        event_type: str,
        payload: Dict[str, Any],
        webhook_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Send an event to the EasyConnect webhook.
        
        Args:
            event_type: Type of event from EVENT_TYPES
            payload: Event data payload
            webhook_url: Optional custom webhook URL (defaults to configured URL)
        
        Returns:
            Response from webhook
        """
        url = webhook_url or self.webhook_url
        
        if not url:
            logger.warning("No EasyConnect webhook URL configured, skipping event")
            return {"skipped": True, "reason": "No webhook URL configured"}
        
        # Build event envelope
        event_data = {
            "event_type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "source": "veriassets",
            "network": settings.qubic_network,
            "payload": payload,
        }
        
        # Serialize payload
        payload_json = json.dumps(event_data, default=str)
        
        # Generate signature
        signature = self._generate_signature(payload_json)
        
        headers = {
            "Content-Type": "application/json",
            "X-VeriAssets-Signature": signature,
            "X-VeriAssets-Event": event_type,
        }
        
        try:
            logger.info(f"Sending EasyConnect event: {event_type}")
            
            response = await self.client.post(
                url,
                content=payload_json,
                headers=headers
            )
            
            response.raise_for_status()
            
            result = {
                "success": True,
                "status_code": response.status_code,
                "event_type": event_type,
            }
            
            try:
                result["response"] = response.json()
            except json.JSONDecodeError:
                result["response"] = response.text
            
            logger.info(f"EasyConnect event sent successfully: {event_type}")
            return result
            
        except httpx.HTTPStatusError as e:
            logger.error(f"EasyConnect webhook failed: {e.response.status_code}")
            raise EasyConnectError(
                message=f"Webhook failed: {e.response.status_code}",
                status_code=e.response.status_code,
                details={"response": e.response.text}
            )
        except httpx.RequestError as e:
            logger.error(f"EasyConnect request error: {str(e)}")
            raise EasyConnectError(
                message=f"Request failed: {str(e)}",
                status_code=503
            )
    
    # ==================== Event Builders ====================
    
    async def notify_rwa_verified(
        self,
        asset_id: str,
        asset_name: str,
        asset_type: str,
        verification_score: float,
        creator_email: Optional[str] = None,
        qubic_address: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Send notification when an RWA is verified"""
        payload = {
            "asset_id": asset_id,
            "asset_name": asset_name,
            "asset_type": asset_type,
            "verification_score": verification_score,
            "verification_status": "verified" if verification_score >= 0.7 else "needs_review",
            "creator_email": creator_email,
            "qubic_address": qubic_address,
            "message": f"✅ {asset_name} verified by AI with {verification_score * 100:.1f}% confidence. Ready for IDO.",
        }
        return await self.send_event(self.EVENT_TYPES["RWA_VERIFIED"], payload)
    
    async def notify_trade_completed(
        self,
        trade_id: str,
        asset_id: str,
        asset_name: str,
        trade_type: str,  # buy/sell
        quantity: int,
        price: float,
        total_amount: float,
        buyer_address: str,
        seller_address: Optional[str] = None,
        qubic_tx_hash: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Send notification when a trade is completed"""
        payload = {
            "trade_id": trade_id,
            "asset_id": asset_id,
            "asset_name": asset_name,
            "trade_type": trade_type,
            "quantity": quantity,
            "price": price,
            "total_amount": total_amount,
            "buyer_address": buyer_address,
            "seller_address": seller_address,
            "qubic_tx_hash": qubic_tx_hash,
            "message": f"💰 Trade completed: {quantity} {asset_name} for {total_amount} QUBIC",
        }
        return await self.send_event(self.EVENT_TYPES["TRADE_COMPLETED"], payload)
    
    async def notify_trade_milestone(
        self,
        asset_id: str,
        asset_name: str,
        milestone_amount: float,
        total_volume: float,
        trader_address: str,
        airdrop_amount: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Send notification when a trade milestone is reached"""
        payload = {
            "asset_id": asset_id,
            "asset_name": asset_name,
            "milestone_amount": milestone_amount,
            "total_volume": total_volume,
            "trader_address": trader_address,
            "airdrop_amount": airdrop_amount,
            "message": f"🎉 Milestone reached! {total_volume} QUBIC traded on {asset_name}",
        }
        return await self.send_event(self.EVENT_TYPES["TRADE_MILESTONE"], payload)
    
    async def notify_proposal_submitted(
        self,
        proposal_id: str,
        asset_id: str,
        asset_name: str,
        title: str,
        creator_address: str,
        voting_deadline: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Send notification when a Nostromo proposal is submitted"""
        payload = {
            "proposal_id": proposal_id,
            "asset_id": asset_id,
            "asset_name": asset_name,
            "title": title,
            "creator_address": creator_address,
            "voting_deadline": voting_deadline,
            "message": f"📋 New Nostromo proposal: {title} for {asset_name}",
        }
        return await self.send_event(self.EVENT_TYPES["PROPOSAL_SUBMITTED"], payload)
    
    async def notify_ipo_started(
        self,
        proposal_id: str,
        asset_id: str,
        asset_name: str,
        start_price: float,
        total_shares: int,
        end_time: str,
    ) -> Dict[str, Any]:
        """Send notification when an IPO (Dutch auction) starts"""
        payload = {
            "proposal_id": proposal_id,
            "asset_id": asset_id,
            "asset_name": asset_name,
            "start_price": start_price,
            "total_shares": total_shares,
            "end_time": end_time,
            "message": f"🚀 IPO started for {asset_name}! Starting price: {start_price} QUBIC",
        }
        return await self.send_event(self.EVENT_TYPES["IPO_STARTED"], payload)
    
    async def notify_verification_failed(
        self,
        asset_id: str,
        asset_name: str,
        issues: list,
        creator_email: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Send notification when verification fails"""
        payload = {
            "asset_id": asset_id,
            "asset_name": asset_name,
            "issues": issues,
            "creator_email": creator_email,
            "message": f"❌ Verification failed for {asset_name}. Issues: {', '.join(issues[:3])}",
        }
        return await self.send_event(self.EVENT_TYPES["VERIFICATION_FAILED"], payload)
    
    async def trigger_airdrop(
        self,
        recipient_address: str,
        amount: float,
        token_name: str,
        reason: str,
    ) -> Dict[str, Any]:
        """Trigger an airdrop via EasyConnect automation"""
        payload = {
            "recipient_address": recipient_address,
            "amount": amount,
            "token_name": token_name,
            "reason": reason,
            "message": f"🪂 Airdrop triggered: {amount} {token_name} to {recipient_address[:16]}...",
        }
        return await self.send_event(self.EVENT_TYPES["AIRDROP_TRIGGERED"], payload)


# Service factory
def get_easyconnect_service() -> EasyConnectService:
    """Get EasyConnect service instance"""
    return EasyConnectService()
