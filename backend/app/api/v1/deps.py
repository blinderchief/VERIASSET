"""
API Dependencies
Authentication, authorization, and common dependencies
"""

from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
import httpx

from app.db.database import get_session
from app.db.models import User
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Security scheme
security = HTTPBearer(auto_error=False)


async def verify_clerk_token(token: str) -> dict:
    """
    Verify a Clerk JWT token.
    
    In production, this would validate against Clerk's JWKS endpoint.
    For hackathon demo, we do simplified validation.
    """
    try:
        # For demo: decode without verification
        # In production: fetch JWKS from Clerk and verify properly
        payload = jwt.decode(
            token,
            settings.clerk_secret_key,
            algorithms=["RS256"],
            options={"verify_signature": False}  # Demo only!
        )
        return payload
    except JWTError as e:
        logger.warning(f"JWT verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session: AsyncSession = Depends(get_session),
) -> User:
    """
    Get the current authenticated user from the JWT token.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify token
    token_data = await verify_clerk_token(credentials.credentials)
    
    clerk_id = token_data.get("sub")
    if not clerk_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing subject",
        )
    
    # Get user from database
    result = await session.execute(
        select(User).where(User.clerk_id == clerk_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        # Auto-create user from token data (for demo)
        user = User(
            clerk_id=clerk_id,
            email=token_data.get("email", f"{clerk_id}@temp.veriassets.io"),
            username=token_data.get("username"),
            full_name=token_data.get("name"),
            avatar_url=token_data.get("picture"),
        )
        session.add(user)
        await session.flush()
        logger.info(f"Auto-created user for Clerk ID: {clerk_id}")
    
    return user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session: AsyncSession = Depends(get_session),
) -> Optional[User]:
    """
    Get the current user if authenticated, otherwise None.
    Useful for endpoints that have different behavior for authenticated users.
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials, session)
    except HTTPException:
        return None


async def get_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Ensure the current user is an admin.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


class RateLimiter:
    """
    Simple rate limiter dependency.
    In production, use Redis for distributed rate limiting.
    """
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self._requests: dict = {}
    
    async def __call__(
        self,
        x_forwarded_for: Optional[str] = Header(None),
    ):
        # For demo, always allow
        # In production: implement proper rate limiting
        pass


rate_limiter = RateLimiter(settings.rate_limit_per_minute)
