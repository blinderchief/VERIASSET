"""
VeriAssets - AI-Verified Real-World Asset Marketplace & Launchpad

Main FastAPI Application Entry Point
Built for Qubic Hackathon
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import uvicorn

from app.core.config import settings
from app.core.logging import get_logger, setup_logging
from app.db.database import init_db, close_db
from app.api.v1 import api_router

# Setup logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("🚀 Starting VeriAssets API...")
    logger.info(f"Environment: {settings.app_env}")
    logger.info(f"Debug mode: {settings.app_debug}")
    
    # Initialize database
    try:
        await init_db()
        logger.info("✅ Database initialized")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise
    
    logger.info("✅ VeriAssets API started successfully!")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down VeriAssets API...")
    await close_db()
    logger.info("✅ VeriAssets API shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="VeriAssets API",
    description="""
    ## AI-Verified Real-World Asset Marketplace & Launchpad
    
    VeriAssets is a groundbreaking platform that tokenizes real-world assets (RWAs) 
    on the Qubic network, leveraging AI for verification and Nostromo for decentralized 
    governance.
    
    ### Key Features:
    - 🤖 **AI-Powered Verification** - Gemini 1.5 Flash verifies asset authenticity
    - 🏦 **RWA Tokenization** - Carbon credits, real estate, treasury assets
    - 🗳️ **Nostromo Governance** - Community-driven proposal and voting
    - 🏷️ **Dutch Auction IPO** - Fair price discovery for new listings
    - ⚡ **Qubic Integration** - Instant finality, 0.3% burn mechanism
    - 🔗 **EasyConnect** - Webhook automation for Make.com/Zapier
    
    ### Built for Qubic Hackathon
    """,
    version="1.0.0",
    docs_url="/docs" if settings.app_debug else None,
    redoc_url="/redoc" if settings.app_debug else None,
    openapi_url="/openapi.json" if settings.app_debug else None,
    lifespan=lifespan,
)


# ==================== Middleware ====================

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests."""
    import time
    import uuid
    
    request_id = str(uuid.uuid4())[:8]
    start_time = time.time()
    
    # Add request ID to state for correlation
    request.state.request_id = request_id
    
    logger.info(
        f"[{request_id}] {request.method} {request.url.path}",
        extra={"correlation_id": request_id}
    )
    
    response = await call_next(request)
    
    process_time = (time.time() - start_time) * 1000
    logger.info(
        f"[{request_id}] Completed in {process_time:.2f}ms - Status: {response.status_code}",
        extra={"correlation_id": request_id}
    )
    
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
    
    return response


# ==================== Exception Handlers ====================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with better formatting."""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": errors,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.exception(f"Unhandled exception: {exc}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "message": str(exc) if settings.app_debug else "An unexpected error occurred",
        },
    )


# ==================== Include Routers ====================

# API v1 routes
app.include_router(api_router, prefix="/api/v1")


# ==================== Root Endpoints ====================

@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - API information."""
    return {
        "name": "VeriAssets API",
        "version": "1.0.0",
        "description": "AI-Verified Real-World Asset Marketplace & Launchpad",
        "docs": "/docs" if settings.app_debug else "Disabled in production",
        "health": "/health",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring."""
    from app.db.database import get_session
    
    status_checks = {
        "api": "healthy",
        "database": "unknown",
    }
    
    # Check database
    try:
        async for session in get_session():
            await session.execute("SELECT 1")
            status_checks["database"] = "healthy"
            break
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        status_checks["database"] = "unhealthy"
    
    overall_healthy = all(v == "healthy" for v in status_checks.values())
    
    return {
        "status": "healthy" if overall_healthy else "degraded",
        "checks": status_checks,
        "environment": settings.app_env,
    }


@app.get("/api/v1/status", tags=["Health"])
async def api_status():
    """API v1 status endpoint."""
    return {
        "api_version": "v1",
        "status": "operational",
        "features": {
            "rwa_marketplace": True,
            "ai_verification": True,
            "nostromo_governance": True,
            "dutch_auction_ipo": True,
            "easyconnect_webhooks": True,
        },
        "networks": {
            "mainnet": settings.qubic_rpc_url,
            "testnet": settings.qubic_testnet_rpc_url,
        },
    }


# ==================== Run Application ====================

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.app_debug,
        log_level="debug" if settings.app_debug else "info",
    )
