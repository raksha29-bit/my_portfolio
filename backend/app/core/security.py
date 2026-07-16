from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
import bcrypt
import jwt
from app.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against its hashed version using bcrypt.
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """
    Generate a bcrypt hash of a password.
    """
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")



def create_access_token(
    subject: Union[str, Any], 
    expires_delta: timedelta = None,
    token_version: int = None
) -> str:
    """
    Create a JWT access token containing the subject, expiration, and optional token version.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    if token_version is not None:
        to_encode["token_version"] = token_version
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def mask_ip(ip: Optional[str]) -> Optional[str]:
    """
    Mask the client IP address from a privacy standpoint.
    IPv4: 192.168.1.1 -> 192.168.xxx.xxx
    IPv6: 2001:db8:85a3:8d3:1319:8a2e:370:7348 -> 2001:db8:85a3:8d3:xxxx:xxxx:xxxx:xxxx
    """
    if not ip:
        return ip
    
    # Check if IPv6 (contains colons)
    if ":" in ip:
        parts = ip.split(":")
        masked_parts = []
        for i, part in enumerate(parts):
            if i >= len(parts) // 2:
                masked_parts.append("xxxx")
            else:
                masked_parts.append(part)
        return ":".join(masked_parts)
    
    # IPv4 (contains dots)
    if "." in ip:
        parts = ip.split(".")
        if len(parts) == 4:
            return f"{parts[0]}.{parts[1]}.xxx.xxx"
    
    return ip
