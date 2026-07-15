from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.schemas.game_config import GameConfigOut, GameConfigUpdate
from app.services import game_config as config_service

router = APIRouter()


@router.get("/configs", response_model=List[GameConfigOut])
def list_configs(db: Session = Depends(deps.get_db)) -> Any:
    """
    List active game configuration rules and styles.
    """
    return config_service.get_configs(db)


@router.put("/configs/{key}", response_model=GameConfigOut)
def update_config(
    key: str,
    config_in: GameConfigUpdate,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Update a game configuration setting (requires administrator privileges).
    """
    db_config = config_service.get_config_by_key(db, key=key)
    if not db_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuration setting '{key}' not found.",
        )
    return config_service.update_config(db, db_config=db_config, config_in=config_in)
