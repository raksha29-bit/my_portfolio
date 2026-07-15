from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.api import deps
from app.config import settings
from app.core import security
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserOut
from app.services import user as user_service

router = APIRouter()


class JsonLoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/login/access-token", response_model=Token)
def login_access_token(
    response: Response,
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    OAuth2 compatible token login, getting an access token for future requests.
    Sets an HttpOnly cookie 'access_token' and returns the token in the body.
    """
    user = user_service.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_str = security.create_access_token(
        user.email, expires_delta=access_token_expires
    )

    response.set_cookie(
        key="access_token",
        value=token_str,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,
    )

    return Token(access_token=token_str)


@router.post("/login", response_model=Token)
def login_json(
    response: Response,
    login_data: JsonLoginRequest,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Alternative JSON body login endpoint.
    Sets an HttpOnly cookie 'access_token' and returns the token in the body.
    """
    user = user_service.get_user_by_email(db, email=login_data.email)
    if not user or not security.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_str = security.create_access_token(
        user.email, expires_delta=access_token_expires
    )

    response.set_cookie(
        key="access_token",
        value=token_str,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,
    )

    return Token(access_token=token_str)


@router.post("/logout")
def logout(response: Response) -> Any:
    """
    Log out the user by clearing the HttpOnly access_token cookie.
    """
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax",
        secure=False,
    )
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserOut)
def read_user_me(
    current_user: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Get current logged-in active admin user.
    """
    return current_user
