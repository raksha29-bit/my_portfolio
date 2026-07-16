from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict


# PortfolioSection Schemas
class PortfolioSectionBase(BaseModel):
    name: str
    slug: str
    icon: Optional[str] = None
    allowed_content_types: List[str] = []
    display_order: int = 0
    is_active: bool = True


class PortfolioSectionCreate(PortfolioSectionBase):
    pass


class PortfolioSectionUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    icon: Optional[str] = None
    allowed_content_types: Optional[List[str]] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class PortfolioSectionOut(PortfolioSectionBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# PortfolioItem Schemas
class PortfolioItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    content_body: Optional[str] = None
    custom_metadata: Dict[str, Any] = {}
    status: str = "draft"
    display_order: int = 0
    is_featured: bool = False


class PortfolioItemCreate(PortfolioItemBase):
    section_id: uuid.UUID


class PortfolioItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content_body: Optional[str] = None
    custom_metadata: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    display_order: Optional[int] = None
    section_id: Optional[uuid.UUID] = None
    is_featured: Optional[bool] = None


class PortfolioItemOut(PortfolioItemBase):
    id: uuid.UUID
    section_id: uuid.UUID
    current_version: int
    is_deleted: bool
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# PortfolioItemVersion Schemas
class PortfolioItemVersionOut(BaseModel):
    id: uuid.UUID
    portfolio_item_id: uuid.UUID
    version_number: int
    title: str
    description: Optional[str] = None
    content_body: Optional[str] = None
    custom_metadata: Dict[str, Any] = {}
    created_by_user_id: Optional[uuid.UUID] = None
    is_featured: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
