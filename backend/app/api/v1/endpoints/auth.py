from datetime import datetime, timezone, timedelta
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status, Request, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.api import deps
from app.config import settings
from app.core import security
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserOut, UserUpdate, AdminCreateRequest, PasswordUpdate
from app.services import user as user_service

router = APIRouter()


class JsonLoginRequest(BaseModel):
    email_or_username: str
    password: str


@router.post("/login/access-token", response_model=Token)
def login_access_token(
    response: Response,
    request: Request,
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    OAuth2 compatible token login, getting an access token for future requests.
    Sets an HttpOnly cookie 'access_token' and returns the token in the body.
    Supports email or username login. Implements brute-force lockout.
    """
    user = user_service.get_user_by_username_or_email(db, identifier=form_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email/username or password",
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    # Check brute-force lockout status
    if user.locked_until and user.locked_until > datetime.utcnow():
        remaining_seconds = int((user.locked_until - datetime.utcnow()).total_seconds())
        remaining_minutes = max(1, remaining_seconds // 60)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Account is temporarily locked. Try again in {remaining_minutes} minute(s).",
        )

    # Verify password
    if not security.verify_password(form_data.password, user.hashed_password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=5)
            db.add(user)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account locked due to too many failed login attempts. Try again in 5 minutes.",
            )
        db.add(user)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email/username or password",
        )

    # Reset failed login stats and store session analytics
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.utcnow()
    user.user_agent = request.headers.get("user-agent")
    user.masked_ip = security.mask_ip(request.client.host if request.client else None)
    
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_str = security.create_access_token(
        user.email, expires_delta=access_token_expires, token_version=user.token_version
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
    request: Request,
    login_data: JsonLoginRequest,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Alternative JSON body login endpoint.
    Sets an HttpOnly cookie 'access_token' and returns the token in the body.
    Supports email or username login. Implements brute-force lockout.
    """
    user = user_service.get_user_by_username_or_email(db, identifier=login_data.email_or_username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email/username or password",
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    # Check brute-force lockout status
    if user.locked_until and user.locked_until > datetime.utcnow():
        remaining_seconds = int((user.locked_until - datetime.utcnow()).total_seconds())
        remaining_minutes = max(1, remaining_seconds // 60)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Account is temporarily locked. Try again in {remaining_minutes} minute(s).",
        )

    # Verify password
    if not security.verify_password(login_data.password, user.hashed_password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=5)
            db.add(user)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account locked due to too many failed login attempts. Try again in 5 minutes.",
            )
        db.add(user)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email/username or password",
        )

    # Reset failed login stats and store session analytics
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.utcnow()
    user.user_agent = request.headers.get("user-agent")
    user.masked_ip = security.mask_ip(request.client.host if request.client else None)
    
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_str = security.create_access_token(
        user.email, expires_delta=access_token_expires, token_version=user.token_version
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


@router.get("/setup-status")
def get_setup_status(db: Session = Depends(deps.get_db)) -> Any:
    """
    Check if a real administrator account has been set up.
    Returns whether setup is required (i.e. no users exist, or only the default dev account exists).
    """
    total_users = db.query(User).filter(User.is_deleted == False).count()
    if total_users == 0:
        return {"setup_required": True, "has_dev_account": False}
        
    dev_user = db.query(User).filter(
        User.email == settings.ADMIN_EMAIL, 
        User.is_deleted == False
    ).first()
    
    if dev_user and total_users == 1:
        return {"setup_required": True, "has_dev_account": True}
        
    return {"setup_required": False, "has_dev_account": dev_user is not None}


@router.post("/setup-admin", status_code=status.HTTP_201_CREATED, response_model=UserOut)
def setup_first_admin(
    admin_in: AdminCreateRequest,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Setup the first administrator account if no users currently exist, or if only the default dev account exists.
    Permanently disables itself once a real administrator is created.
    """
    total_users = db.query(User).filter(User.is_deleted == False).count()
    dev_user = db.query(User).filter(User.email == settings.ADMIN_EMAIL, User.is_deleted == False).first()
    
    # Enforce lockout: if a real administrator already exists
    if total_users > 1 or (total_users == 1 and not dev_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Setup is permanently disabled as an administrator already exists.",
        )
        
    # Enforce uniqueness constraints
    existing_email = db.query(User).filter(User.email == admin_in.email, User.is_deleted == False).first()
    if existing_email and (not dev_user or dev_user.id != existing_email.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already in use.",
        )
        
    existing_username = db.query(User).filter(User.username == admin_in.username, User.is_deleted == False).first()
    if existing_username and (not dev_user or dev_user.id != existing_username.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already in use.",
        )

    # Create user update payload to replace default admin, or create new user
    if dev_user and admin_in.email == dev_user.email:
        # User is replacing the dev credentials using the same email
        from app.schemas.user import UserCreate
        updated = user_service.update_user(
            db, 
            db_user=dev_user, 
            user_in=UserUpdate(
                username=admin_in.username,
                display_name=admin_in.display_name,
                avatar_url=admin_in.avatar_url,
                password=admin_in.password
            )
        )
        return updated

    # Otherwise create new user
    from app.schemas.user import UserCreate
    user_create = UserCreate(
        email=admin_in.email,
        username=admin_in.username,
        display_name=admin_in.display_name,
        avatar_url=admin_in.avatar_url,
        password=admin_in.password,
        is_active=True,
    )
    db_user = user_service.create_user(db, user_in=user_create)
    
    # If the dev user existed and is a different account, delete it
    if dev_user and dev_user.id != db_user.id:
        db.delete(dev_user)
        db.commit()
        
    return db_user


@router.put("/change-password")
def change_password(
    password_data: PasswordUpdate,
    current_user: User = Depends(deps.get_current_active_admin),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Change current administrator password after verifying current password.
    """
    if not security.verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password",
        )
        
    if password_data.new_password != password_data.password_confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirmation password do not match",
        )
        
    # Update password and increment token version to force log out of other devices
    current_user.token_version += 1
    user_service.update_user(db, db_user=current_user, user_in=UserUpdate(password=password_data.new_password))
    
    return {"message": "Password changed successfully"}


@router.put("/update-profile", response_model=UserOut)
def update_profile(
    response: Response,
    profile_data: UserUpdate,
    current_user: User = Depends(deps.get_current_active_admin),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Update administrator profile details (email, username, display_name, avatar_url).
    If email changes, refresh the JWT token in cookies to maintain session validity.
    """
    # Enforce uniqueness for email
    if profile_data.email and profile_data.email != current_user.email:
        existing_email = db.query(User).filter(User.email == profile_data.email, User.is_deleted == False).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address already in use.",
            )

    # Enforce uniqueness for username
    if profile_data.username and profile_data.username != current_user.username:
        existing_username = db.query(User).filter(User.username == profile_data.username, User.is_deleted == False).first()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already in use.",
            )

    # Prevent password update via this endpoint
    profile_data.password = None
    
    updated_user = user_service.update_user(db, db_user=current_user, user_in=profile_data)
    
    # Re-issue cookies to maintain valid session
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_str = security.create_access_token(
        updated_user.email, expires_delta=access_token_expires, token_version=updated_user.token_version
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
    
    return updated_user


@router.post("/logout-all-devices")
def logout_all_devices(
    response: Response,
    current_user: User = Depends(deps.get_current_active_admin),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Invalidate all active session tokens by incrementing user's token_version.
    Clears local cookie.
    """
    current_user.token_version += 1
    db.add(current_user)
    db.commit()
    
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="lax",
        secure=False,
    )
    return {"message": "Successfully logged out from all devices"}


@router.post("/upload-avatar")
def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Upload an avatar image during first-time administrator setup.
    Only accessible if setup is required (no admin set up yet).
    """
    # Check setup status
    total_users = db.query(User).filter(User.is_deleted == False).count()
    dev_user = db.query(User).filter(User.email == settings.ADMIN_EMAIL, User.is_deleted == False).first()
    
    if total_users > 1 or (total_users == 1 and not dev_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Profile picture upload is restricted once setup is complete.",
        )
        
    from app.core.storage import get_storage_provider
    storage_provider = get_storage_provider()
    try:
        upload_data = storage_provider.upload_file(file, folder="avatars")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not upload avatar: {str(e)}",
        )
        
    return {"secure_url": upload_data["secure_url"]}


@router.post("/upload-my-avatar")
def upload_my_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_active_admin),
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Upload a profile picture for the logged-in administrator.
    """
    from app.core.storage import get_storage_provider
    storage_provider = get_storage_provider()
    try:
        upload_data = storage_provider.upload_file(file, folder="avatars")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not upload avatar: {str(e)}",
        )
        
    current_user.avatar_url = upload_data["secure_url"]
    db.add(current_user)
    db.commit()
    
    return {"secure_url": upload_data["secure_url"]}
