"""
VeriAssets Database Configuration
SQLModel with async support for Neon Postgres
"""

from typing import AsyncGenerator
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from app.core.config import settings
from app.core.logging import get_logger
import ssl

logger = get_logger(__name__)


def get_database_url() -> str:
    """
    Get the database URL with proper SSL handling for asyncpg.
    asyncpg doesn't support sslmode in the URL, so we need to clean it.
    """
    db_url = settings.database_url
    # Remove sslmode and channel_binding from URL as asyncpg handles these differently
    if "?" in db_url:
        base_url = db_url.split("?")[0]
        return base_url
    return db_url


def get_connect_args() -> dict:
    """Get connection arguments for asyncpg with SSL support."""
    # Create SSL context for secure connection to Neon
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    return {"ssl": ssl_context}


# Create async engine for Neon (use NullPool for serverless)
engine = create_async_engine(
    get_database_url(),
    echo=settings.app_debug,
    poolclass=NullPool,  # Required for serverless Postgres like Neon
    future=True,
    connect_args=get_connect_args(),
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def init_db() -> None:
    """Initialize database tables"""
    async with engine.begin() as conn:
        # Import all models to ensure they're registered
        from app.db import models  # noqa: F401
        
        await conn.run_sync(SQLModel.metadata.create_all)
        logger.info("Database tables initialized")


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency to get database session"""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def close_db() -> None:
    """Close database connection"""
    await engine.dispose()
    logger.info("Database connection closed")
