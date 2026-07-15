import uuid
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash


def get_user(db: Session, user_id: uuid.UUID) -> Optional[User]:
    """
    Retrieve a user by their unique ID, ignoring soft-deleted users.
    """
    return db.query(User).filter(User.id == user_id, User.is_deleted == False).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """
    Retrieve a user by their email address, ignoring soft-deleted users.
    """
    return db.query(User).filter(User.email == email, User.is_deleted == False).first()



def create_user(db: Session, user_in: UserCreate) -> User:
    """
    Create a new user with a hashed password.
    """
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        is_active=user_in.is_active,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, db_user: User, user_in: UserUpdate) -> User:
    """
    Update an existing user's attributes (email, password, is_active).
    """
    if user_in.email is not None:
        db_user.email = user_in.email
    if user_in.password is not None:
        db_user.hashed_password = get_password_hash(user_in.password)
    if user_in.is_active is not None:
        db_user.is_active = user_in.is_active
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
