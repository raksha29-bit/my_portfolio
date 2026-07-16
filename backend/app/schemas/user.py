from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserOut(UserBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    is_deleted: bool
    deleted_at: Optional[datetime] = None
    
    # Session details
    last_login: Optional[datetime] = None
    user_agent: Optional[str] = None
    masked_ip: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AdminCreateRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str
    password_confirm: str
