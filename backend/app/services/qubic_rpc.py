"""
Qubic RPC Client Service
Handles all interactions with the Qubic blockchain
"""

import base64
import hashlib
import struct
from typing import Any, Dict, List, Optional
from datetime import datetime
import httpx
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class QubicRPCError(Exception):
    """Custom exception for Qubic RPC errors"""
    def __init__(self, message: str, status_code: int = 500, details: Optional[Dict] = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class QubicRPCClient:
    """
    Qubic RPC Client for interacting with the Qubic blockchain.
    Supports both mainnet and testnet.
    """
    
    # Contract addresses
    QX_CONTRACT_ADDRESS = "BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID"
    QX_CONTRACT_INDEX = 1
    
    # QX Procedure numbers
    QX_PROCEDURES = {
        "ISSUE_ASSET": 1,
        "TRANSFER_SHARES": 2,
        "ADD_TO_ASK_ORDER": 5,  # Sell order
        "ADD_TO_BID_ORDER": 6,  # Buy order
        "REMOVE_FROM_ASK_ORDER": 7,
        "REMOVE_FROM_BID_ORDER": 8,
    }
    
    def __init__(self, rpc_url: Optional[str] = None):
        self.rpc_url = rpc_url or settings.active_qubic_rpc
        self._client: Optional[httpx.AsyncClient] = None
        self._timeout = httpx.Timeout(30.0, connect=10.0)
    
    async def __aenter__(self):
        self._client = httpx.AsyncClient(
            base_url=self.rpc_url,
            timeout=self._timeout,
            headers={"Content-Type": "application/json"}
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._client:
            await self._client.aclose()
    
    @property
    def client(self) -> httpx.AsyncClient:
        if not self._client:
            raise RuntimeError("Client not initialized. Use async context manager.")
        return self._client
    
    async def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """Make HTTP request to Qubic RPC"""
        try:
            if method.upper() == "GET":
                response = await self.client.get(endpoint)
            else:
                response = await self.client.post(endpoint, json=data)
            
            response.raise_for_status()
            return response.json()
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Qubic RPC HTTP error: {e.response.status_code} - {e.response.text}")
            raise QubicRPCError(
                message=f"HTTP error: {e.response.status_code}",
                status_code=e.response.status_code,
                details={"response": e.response.text}
            )
        except httpx.RequestError as e:
            logger.error(f"Qubic RPC request error: {str(e)}")
            raise QubicRPCError(
                message=f"Request failed: {str(e)}",
                status_code=503
            )
    
    # ==================== Status & Info ====================
    
    async def get_status(self) -> Dict[str, Any]:
        """Get current network status"""
        return await self._request("GET", "/v1/status")
    
    async def get_tick_info(self) -> Dict[str, Any]:
        """Get current tick information"""
        return await self._request("GET", "/v1/tick-info")
    
    async def get_current_tick(self) -> int:
        """Get current tick number"""
        result = await self.get_tick_info()
        return result.get("tickInfo", {}).get("tick", 0)
    
    async def get_tick_data(self, tick_number: int) -> Dict[str, Any]:
        """Get detailed tick data"""
        return await self._request("GET", f"/v2/ticks/{tick_number}/transactions")
    
    # ==================== Balance & Assets ====================
    
    async def get_balance(self, identity_id: str) -> Dict[str, Any]:
        """Get balance for an identity"""
        return await self._request("GET", f"/v1/balances/{identity_id}")
    
    async def get_owned_assets(self, identity_id: str) -> Dict[str, Any]:
        """Get all assets owned by an identity"""
        return await self._request("GET", f"/v1/assets/{identity_id}/owned")
    
    async def get_issued_assets(self, identity_id: str) -> Dict[str, Any]:
        """Get all assets issued by an identity"""
        return await self._request("GET", f"/v1/assets/{identity_id}/issued")
    
    # ==================== Smart Contract Queries ====================
    
    async def query_smart_contract(
        self,
        contract_index: int,
        input_type: int,
        input_size: int,
        request_data: str,  # Base64 encoded
    ) -> Dict[str, Any]:
        """Query a smart contract (read-only)"""
        payload = {
            "contractIndex": contract_index,
            "inputType": input_type,
            "inputSize": input_size,
            "requestData": request_data,
        }
        return await self._request("POST", "/v1/querySmartContract", payload)
    
    # ==================== Transactions ====================
    
    async def broadcast_transaction(self, encoded_transaction: str) -> Dict[str, Any]:
        """Broadcast a signed transaction"""
        payload = {"encodedTransaction": encoded_transaction}
        return await self._request("POST", "/v1/broadcast-transaction", payload)
    
    async def get_transaction(self, tx_id: str) -> Dict[str, Any]:
        """Get transaction details"""
        return await self._request("GET", f"/v1/transactions/{tx_id}")
    
    async def get_transaction_status(self, tx_id: str) -> Dict[str, Any]:
        """Get transaction status"""
        return await self._request("GET", f"/v1/tx-status/{tx_id}")
    
    # ==================== RWA Asset Operations ====================
    
    def encode_asset_name(self, name: str) -> bytes:
        """Encode asset name to uint64 bytes"""
        # Pad to 8 bytes and encode
        padded = name.ljust(8, '\0')[:8]
        return padded.encode('utf-8')
    
    def create_issue_asset_payload(
        self,
        asset_name: str,
        number_of_units: int,
        unit_of_measurement: str,
        number_of_decimal_places: int,
    ) -> bytes:
        """
        Create payload for issuing a new asset
        Struct: assetName(8) + numberOfUnits(8) + unitOfMeasurement(8) + numberOfDecimalPlaces(1)
        Total: 25 bytes
        """
        payload = bytearray()
        
        # Asset name (8 bytes)
        payload.extend(self.encode_asset_name(asset_name))
        
        # Number of units (int64, 8 bytes)
        payload.extend(struct.pack('<q', number_of_units))
        
        # Unit of measurement (8 bytes)
        payload.extend(self.encode_asset_name(unit_of_measurement))
        
        # Number of decimal places (1 byte)
        payload.append(number_of_decimal_places)
        
        return bytes(payload)
    
    def create_transfer_shares_payload(
        self,
        issuer: str,  # Public key
        asset_name: str,
        new_owner: str,  # Public key
        number_of_shares: int,
    ) -> bytes:
        """
        Create payload for transferring shares
        Struct: issuer(32) + assetName(8) + newOwner(32) + numberOfShares(8)
        Total: 80 bytes
        """
        payload = bytearray()
        
        # Issuer public key (32 bytes) - placeholder
        payload.extend(bytes.fromhex(issuer.ljust(64, '0')[:64]))
        
        # Asset name (8 bytes)
        payload.extend(self.encode_asset_name(asset_name))
        
        # New owner public key (32 bytes) - placeholder
        payload.extend(bytes.fromhex(new_owner.ljust(64, '0')[:64]))
        
        # Number of shares (int64, 8 bytes)
        payload.extend(struct.pack('<q', number_of_shares))
        
        return bytes(payload)
    
    def create_bid_order_payload(
        self,
        issuer: str,  # Public key (32 bytes)
        asset_name: str,  # 8 bytes
        price: int,  # sint64, 8 bytes
        number_of_shares: int,  # sint64, 8 bytes
    ) -> bytes:
        """
        Create payload for adding a bid (buy) order
        Total: 56 bytes
        """
        payload = bytearray()
        
        # Issuer (32 bytes)
        payload.extend(bytes.fromhex(issuer.ljust(64, '0')[:64]))
        
        # Asset name (8 bytes)
        payload.extend(self.encode_asset_name(asset_name))
        
        # Price (sint64, 8 bytes)
        payload.extend(struct.pack('<q', price))
        
        # Number of shares (sint64, 8 bytes)
        payload.extend(struct.pack('<q', number_of_shares))
        
        return bytes(payload)
    
    def create_ask_order_payload(
        self,
        issuer: str,
        asset_name: str,
        price: int,
        number_of_shares: int,
    ) -> bytes:
        """
        Create payload for adding an ask (sell) order
        Same structure as bid order
        """
        return self.create_bid_order_payload(issuer, asset_name, price, number_of_shares)
    
    def encode_payload_to_base64(self, payload: bytes) -> str:
        """Encode payload to base64"""
        return base64.b64encode(payload).decode('utf-8')
    
    def decode_response_from_base64(self, data: str) -> bytes:
        """Decode base64 response"""
        return base64.b64decode(data)
    
    # ==================== Oracle Proof Generation ====================
    
    def generate_proof_hash(self, data: Dict[str, Any], timestamp: datetime) -> str:
        """
        Generate a proof hash for AI verification results.
        This is used to create verifiable proofs on-chain.
        """
        # Combine data with timestamp
        proof_data = {
            "data": data,
            "timestamp": timestamp.isoformat(),
        }
        
        # Create SHA256 hash
        proof_string = str(proof_data).encode('utf-8')
        return hashlib.sha256(proof_string).hexdigest()
    
    def sign_oracle_proof(self, proof_hash: str, private_key: str) -> str:
        """
        Sign an oracle proof with a private key.
        In production, this would use Qubic's signing mechanism.
        For hackathon demo, we use a simplified version.
        """
        # Combine proof hash with key for signature
        combined = f"{proof_hash}:{private_key}".encode('utf-8')
        return hashlib.sha256(combined).hexdigest()


# Singleton client factory
async def get_qubic_client() -> QubicRPCClient:
    """Get a Qubic RPC client instance"""
    return QubicRPCClient()
