"""
VeriAssets - Test Configuration
Pytest fixtures and configuration for testing
"""
import pytest
import asyncio
from typing import Generator, AsyncGenerator
from unittest.mock import patch, MagicMock, AsyncMock
import os

# Set test environment
os.environ["TESTING"] = "true"
os.environ["DATABASE_URL"] = "postgresql://test:test@localhost:5432/test_db"
os.environ["GEMINI_API_KEY"] = "test_api_key"
os.environ["CLERK_SECRET_KEY"] = "test_clerk_secret"
os.environ["QUBIC_RPC_URL"] = "https://testnet-rpc.qubic.org"


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_db():
    """Mock database connection."""
    with patch("app.db.database.get_db") as mock:
        mock_session = AsyncMock()
        mock.return_value = mock_session
        yield mock_session


@pytest.fixture
def mock_gemini():
    """Mock Gemini AI service."""
    with patch("app.services.gemini_ai.GeminiAI") as mock:
        instance = mock.return_value
        instance.verify_document = AsyncMock(return_value={
            "is_valid": True,
            "confidence": 0.95,
            "details": {
                "authenticity": "verified",
                "document_type": "carbon_credit",
                "issuer": "Verified Carbon Standard"
            }
        })
        instance.analyze_asset = AsyncMock(return_value={
            "risk_score": 0.2,
            "market_analysis": "Positive outlook",
            "recommendations": ["Hold", "Long-term investment"]
        })
        yield instance


@pytest.fixture
def mock_qubic():
    """Mock Qubic RPC service."""
    with patch("app.services.qubic_rpc.QubicRPC") as mock:
        instance = mock.return_value
        instance.create_token = AsyncMock(return_value={
            "tx_hash": "QUBIC_TX_HASH_123",
            "token_id": "TOKEN_ID_123",
            "status": "confirmed"
        })
        instance.transfer_token = AsyncMock(return_value={
            "tx_hash": "TRANSFER_TX_HASH",
            "status": "confirmed"
        })
        instance.get_balance = AsyncMock(return_value={
            "balance": 1000000,
            "tokens": [
                {"token_id": "TOKEN_1", "amount": 100},
                {"token_id": "TOKEN_2", "amount": 50}
            ]
        })
        instance.get_tick = AsyncMock(return_value=12345678)
        yield instance


@pytest.fixture
def mock_clerk():
    """Mock Clerk authentication."""
    with patch("app.core.auth.verify_clerk_token") as mock:
        mock.return_value = {
            "user_id": "user_test123",
            "email": "test@example.com",
            "verified": True
        }
        yield mock


@pytest.fixture
def mock_easyconnect():
    """Mock EasyConnect webhook service."""
    with patch("app.services.easyconnect.EasyConnect") as mock:
        instance = mock.return_value
        instance.send_webhook = AsyncMock(return_value={"status": "delivered"})
        yield instance


@pytest.fixture
def sample_rwa_data():
    """Sample RWA asset data for testing."""
    return {
        "id": "rwa_test_123",
        "name": "Test Carbon Credit Bundle",
        "description": "100 verified carbon offset credits",
        "asset_type": "carbon_credit",
        "total_supply": 1000,
        "available_supply": 1000,
        "price_per_token": 125.50,
        "owner_id": "user_test123",
        "verified": True,
        "verification_score": 0.95,
        "metadata": {
            "carbon_tons": 100,
            "location": "Amazon Basin",
            "certification": "Verra VCS",
            "vintage_year": 2024
        },
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }


@pytest.fixture
def sample_trade_data():
    """Sample trade data for testing."""
    return {
        "id": "trade_test_123",
        "asset_id": "rwa_test_123",
        "buyer_id": "user_buyer_123",
        "seller_id": "user_seller_123",
        "order_type": "buy",
        "amount": 10,
        "price": 125.50,
        "total": 1255.00,
        "fee": 3.77,  # 0.3% fee
        "status": "completed",
        "tx_hash": "QUBIC_TX_HASH",
        "created_at": "2024-01-01T00:00:00Z"
    }


@pytest.fixture
def sample_proposal_data():
    """Sample governance proposal data for testing."""
    return {
        "id": "proposal_test_123",
        "title": "Reduce Trading Fees",
        "description": "Proposal to reduce trading fees from 0.3% to 0.2%",
        "category": "parameter",
        "proposer_id": "user_test123",
        "status": "active",
        "votes_for": 150,
        "votes_against": 50,
        "quorum_required": 100,
        "threshold_ratio": 2.0,
        "start_time": "2024-01-01T00:00:00Z",
        "end_time": "2024-01-08T00:00:00Z",
        "created_at": "2024-01-01T00:00:00Z"
    }


@pytest.fixture
def sample_ipo_data():
    """Sample IPO/Dutch auction data for testing."""
    return {
        "id": "ipo_test_123",
        "asset_id": "rwa_test_123",
        "asset_name": "Test Carbon Credit Bundle",
        "start_price": 150.00,
        "end_price": 75.00,
        "current_price": 125.00,
        "total_tokens": 10000,
        "sold_tokens": 2500,
        "status": "active",
        "start_time": "2024-01-01T00:00:00Z",
        "end_time": "2024-01-02T00:00:00Z",
        "created_at": "2024-01-01T00:00:00Z"
    }


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "id": "user_test123",
        "clerk_id": "clerk_user_123",
        "email": "test@example.com",
        "wallet_address": "QUBIC_WALLET_ADDRESS_123",
        "wallet_connected": True,
        "kyc_verified": True,
        "created_at": "2024-01-01T00:00:00Z"
    }


# Test environment setup
def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )
    config.addinivalue_line(
        "markers", "websocket: mark test as websocket test"
    )
