from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, ConfigDict


class MediaItemBase(BaseModel):
    cloudinary_public_id: str
    secure_url: str
    resource_type: str
    file_format: Optional[str] = None
    file_size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    display_order: int = 0


class MediaItemCreate(MediaItemBase):
    portfolio_item_id: uuid.UUID


class MediaItemOut(MediaItemBase):
    id: uuid.UUID
    portfolio_item_id: uuid.UUID
    is_deleted: bool
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
