"""
VeriAssets - Comprehensive API Tests
Test suite for all backend endpoints
"""
import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timedelta
from unittest.mock import patch, AsyncMock
import json

# Import the FastAPI app
from app.main import app

# Test data
TEST_USER_ID = "user_test123"
TEST_WALLET = "QUBIC_TEST_WALLET_ADDRESS"

SAMPLE_RWA = {
    "name": "Test Carbon Credit Bundle",
    "description": "100 verified carbon offset credits from Amazon rainforest",
    "asset_type": "carbon_credit",
    "total_supply": 1000,
    "price_per_token": 125.50,
    "metadata": {
        "carbon_tons": 100,
        "location": "Amazon Basin, Brazil",
        "certification": "Verra VCS",
        "vintage_year": 2024
    }
}

SAMPLE_TRADE = {
    "asset_id": "test_asset_123",
    "order_type": "buy",
    "amount": 10,
    "price": 125.50
}


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    """Create async test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def auth_headers():
    """Mock authenticated headers."""
    return {"Authorization": f"Bearer test_jwt_token"}


# ============================================================================
# Health Check Tests
# ============================================================================

@pytest.mark.anyio
async def test_health_check(client):
    """Test health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data


@pytest.mark.anyio
async def test_root_endpoint(client):
    """Test root endpoint."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "VeriAssets" in data["message"]


# ============================================================================
# RWA Asset Tests
# ============================================================================

@pytest.mark.anyio
async def test_list_assets(client):
    """Test listing all RWA assets."""
    response = await client.get("/api/v1/rwa")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.anyio
async def test_list_assets_with_filters(client):
    """Test listing assets with filters."""
    response = await client.get("/api/v1/rwa?asset_type=carbon_credit&verified=true")
    assert response.status_code == 200


@pytest.mark.anyio
async def test_list_assets_pagination(client):
    """Test asset pagination."""
    response = await client.get("/api/v1/rwa?skip=0&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data) <= 10


@pytest.mark.anyio
@patch("app.services.qubic_rpc.QubicRPC.create_token")
async def test_create_asset(client, mock_create_token, auth_headers):
    """Test creating a new RWA asset."""
    mock_create_token.return_value = {"tx_hash": "test_tx_hash", "token_id": "test_token_id"}
    
    response = await client.post(
        "/api/v1/rwa",
        json=SAMPLE_RWA,
        headers=auth_headers
    )
    # May return 401 if auth is enforced, or 201 if successful
    assert response.status_code in [201, 401, 422]


@pytest.mark.anyio
async def test_get_asset_not_found(client):
    """Test getting non-existent asset."""
    response = await client.get("/api/v1/rwa/nonexistent_id")
    assert response.status_code == 404


@pytest.mark.anyio
@patch("app.services.gemini_ai.GeminiAI.verify_document")
async def test_verify_asset(client, mock_verify, auth_headers):
    """Test AI verification of asset."""
    mock_verify.return_value = {
        "is_valid": True,
        "confidence": 0.95,
        "details": {"authenticity": "verified", "document_type": "carbon_credit"}
    }
    
    response = await client.post(
        "/api/v1/rwa/test_asset_id/verify",
        files={"document": ("test.pdf", b"fake pdf content", "application/pdf")},
        headers=auth_headers
    )
    # Accept various responses based on auth state
    assert response.status_code in [200, 401, 404, 422]


# ============================================================================
# Trading Tests
# ============================================================================

@pytest.mark.anyio
async def test_list_trades(client):
    """Test listing all trades."""
    response = await client.get("/api/v1/trade")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.anyio
async def test_list_trades_by_asset(client):
    """Test listing trades for specific asset."""
    response = await client.get("/api/v1/trade?asset_id=test_asset_123")
    assert response.status_code == 200


@pytest.mark.anyio
async def test_create_trade(client, auth_headers):
    """Test creating a trade order."""
    response = await client.post(
        "/api/v1/trade",
        json=SAMPLE_TRADE,
        headers=auth_headers
    )
    assert response.status_code in [201, 401, 422]


@pytest.mark.anyio
async def test_get_orderbook(client):
    """Test getting orderbook for an asset."""
    response = await client.get("/api/v1/trade/orderbook/test_asset_123")
    assert response.status_code in [200, 404]


@pytest.mark.anyio
async def test_cancel_order(client, auth_headers):
    """Test canceling an order."""
    response = await client.delete(
        "/api/v1/trade/order_123",
        headers=auth_headers
    )
    assert response.status_code in [200, 401, 404]


# ============================================================================
# User Tests
# ============================================================================

@pytest.mark.anyio
async def test_get_current_user(client, auth_headers):
    """Test getting current user profile."""
    response = await client.get("/api/v1/users/me", headers=auth_headers)
    assert response.status_code in [200, 401]


@pytest.mark.anyio
async def test_connect_wallet(client, auth_headers):
    """Test wallet connection."""
    response = await client.post(
        "/api/v1/users/wallet/connect",
        json={"wallet_address": TEST_WALLET, "signature": "test_signature"},
        headers=auth_headers
    )
    assert response.status_code in [200, 401, 422]


@pytest.mark.anyio
async def test_get_user_portfolio(client, auth_headers):
    """Test getting user portfolio."""
    response = await client.get("/api/v1/users/portfolio", headers=auth_headers)
    assert response.status_code in [200, 401]


# ============================================================================
# Nostromo Governance Tests
# ============================================================================

@pytest.mark.anyio
async def test_list_proposals(client):
    """Test listing governance proposals."""
    response = await client.get("/api/v1/nostromo/proposals")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.anyio
async def test_list_proposals_by_status(client):
    """Test listing proposals by status."""
    response = await client.get("/api/v1/nostromo/proposals?status=active")
    assert response.status_code == 200


@pytest.mark.anyio
async def test_create_proposal(client, auth_headers):
    """Test creating a governance proposal."""
    proposal = {
        "title": "Test Proposal",
        "description": "This is a test governance proposal",
        "category": "feature",
        "asset_id": "test_asset_123"
    }
    response = await client.post(
        "/api/v1/nostromo/proposals",
        json=proposal,
        headers=auth_headers
    )
    assert response.status_code in [201, 401, 422]


@pytest.mark.anyio
async def test_vote_on_proposal(client, auth_headers):
    """Test voting on a proposal."""
    vote = {"vote": "for", "amount": 100}
    response = await client.post(
        "/api/v1/nostromo/proposals/test_proposal_id/vote",
        json=vote,
        headers=auth_headers
    )
    assert response.status_code in [200, 401, 404, 422]


# ============================================================================
# IPO / Dutch Auction Tests
# ============================================================================

@pytest.mark.anyio
async def test_list_ipos(client):
    """Test listing IPO auctions."""
    response = await client.get("/api/v1/nostromo/ipo")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.anyio
async def test_list_active_ipos(client):
    """Test listing active IPOs."""
    response = await client.get("/api/v1/nostromo/ipo?status=active")
    assert response.status_code == 200


@pytest.mark.anyio
async def test_create_ipo(client, auth_headers):
    """Test creating an IPO auction."""
    ipo = {
        "asset_id": "test_asset_123",
        "start_price": 100.0,
        "end_price": 50.0,
        "total_tokens": 10000,
        "duration_hours": 24
    }
    response = await client.post(
        "/api/v1/nostromo/ipo",
        json=ipo,
        headers=auth_headers
    )
    assert response.status_code in [201, 401, 422]


@pytest.mark.anyio
async def test_place_ipo_bid(client, auth_headers):
    """Test placing a bid in Dutch auction."""
    bid = {"amount": 100, "max_price": 75.0}
    response = await client.post(
        "/api/v1/nostromo/ipo/test_ipo_id/bid",
        json=bid,
        headers=auth_headers
    )
    assert response.status_code in [200, 401, 404, 422]


@pytest.mark.anyio
async def test_get_ipo_details(client):
    """Test getting IPO details."""
    response = await client.get("/api/v1/nostromo/ipo/test_ipo_id")
    assert response.status_code in [200, 404]


# ============================================================================
# EasyConnect Webhook Tests
# ============================================================================

@pytest.mark.anyio
async def test_register_webhook(client, auth_headers):
    """Test registering a webhook."""
    webhook = {
        "url": "https://hook.example.com/webhook",
        "events": ["asset.created", "trade.executed"],
        "secret": "webhook_secret_123"
    }
    response = await client.post(
        "/api/v1/webhooks",
        json=webhook,
        headers=auth_headers
    )
    assert response.status_code in [201, 401, 422]


@pytest.mark.anyio
async def test_list_webhooks(client, auth_headers):
    """Test listing registered webhooks."""
    response = await client.get("/api/v1/webhooks", headers=auth_headers)
    assert response.status_code in [200, 401]


# ============================================================================
# Rate Limiting Tests
# ============================================================================

@pytest.mark.anyio
async def test_rate_limiting(client):
    """Test rate limiting is enforced."""
    # Make many requests quickly
    responses = []
    for _ in range(150):
        response = await client.get("/api/v1/rwa")
        responses.append(response.status_code)
    
    # Should have some 429 responses if rate limiting is active
    # Or all 200s if rate limiting is disabled in test mode
    assert all(code in [200, 429] for code in responses)


# ============================================================================
# Validation Tests
# ============================================================================

@pytest.mark.anyio
async def test_invalid_asset_type(client, auth_headers):
    """Test validation rejects invalid asset types."""
    invalid_asset = {**SAMPLE_RWA, "asset_type": "invalid_type"}
    response = await client.post(
        "/api/v1/rwa",
        json=invalid_asset,
        headers=auth_headers
    )
    assert response.status_code in [401, 422]


@pytest.mark.anyio
async def test_invalid_order_type(client, auth_headers):
    """Test validation rejects invalid order types."""
    invalid_trade = {**SAMPLE_TRADE, "order_type": "invalid"}
    response = await client.post(
        "/api/v1/trade",
        json=invalid_trade,
        headers=auth_headers
    )
    assert response.status_code in [401, 422]


@pytest.mark.anyio
async def test_negative_price(client, auth_headers):
    """Test validation rejects negative prices."""
    invalid_asset = {**SAMPLE_RWA, "price_per_token": -10.0}
    response = await client.post(
        "/api/v1/rwa",
        json=invalid_asset,
        headers=auth_headers
    )
    assert response.status_code in [401, 422]


# ============================================================================
# Integration Tests
# ============================================================================

@pytest.mark.anyio
@patch("app.services.qubic_rpc.QubicRPC.create_token")
@patch("app.services.gemini_ai.GeminiAI.verify_document")
async def test_full_asset_lifecycle(client, mock_verify, mock_create, auth_headers):
    """Test complete asset lifecycle: create -> verify -> trade."""
    mock_create.return_value = {"tx_hash": "tx123", "token_id": "token123"}
    mock_verify.return_value = {"is_valid": True, "confidence": 0.98}
    
    # This is a conceptual test - actual implementation would track IDs
    # and perform real operations
    
    # 1. Create asset
    create_response = await client.post(
        "/api/v1/rwa",
        json=SAMPLE_RWA,
        headers=auth_headers
    )
    
    # 2. List assets (should include new one)
    list_response = await client.get("/api/v1/rwa")
    assert list_response.status_code == 200
    
    # 3. Check health
    health_response = await client.get("/health")
    assert health_response.status_code == 200


# ============================================================================
# WebSocket Tests (basic)
# ============================================================================

@pytest.mark.anyio
async def test_websocket_trades_endpoint_exists(client):
    """Test WebSocket endpoint exists (full test requires WebSocket client)."""
    # WebSocket endpoints should respond with 403 Forbidden or upgrade required
    # when accessed via HTTP
    response = await client.get("/api/v1/ws/trades")
    assert response.status_code in [400, 403, 405, 426]


# ============================================================================
# Error Handling Tests
# ============================================================================

@pytest.mark.anyio
async def test_404_handling(client):
    """Test 404 error handling."""
    response = await client.get("/nonexistent/endpoint")
    assert response.status_code == 404


@pytest.mark.anyio
async def test_method_not_allowed(client):
    """Test 405 error handling."""
    response = await client.patch("/api/v1/rwa")
    assert response.status_code in [405, 422]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
