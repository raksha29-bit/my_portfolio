from typing import Any, Dict, Optional
import uuid
from pydantic import BaseModel, ConfigDict


class GameConfigCategoryOut(BaseModel):
    id: uuid.UUID
    code: str
    description: str

    model_config = ConfigDict(from_attributes=True)


class GameConfigBase(BaseModel):
    key: str
    value: Dict[str, Any] = {}
    is_active: bool = True


class GameConfigCreate(GameConfigBase):
    category_id: uuid.UUID


class GameConfigUpdate(BaseModel):
    key: Optional[str] = None
    value: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class GameConfigOut(GameConfigBase):
    id: uuid.UUID
    category_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)
