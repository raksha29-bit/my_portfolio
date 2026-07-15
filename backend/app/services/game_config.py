import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.game_config import GameConfig, GameConfigCategory
from app.schemas.game_config import GameConfigUpdate


def get_configs(db: Session) -> List[GameConfig]:
    """
    List all game configuration entries.
    """
    return db.query(GameConfig).all()


def get_config(db: Session, config_id: uuid.UUID) -> Optional[GameConfig]:
    """
    Get a game configuration by ID.
    """
    return db.query(GameConfig).filter(GameConfig.id == config_id).first()


def get_config_by_key(db: Session, key: str) -> Optional[GameConfig]:
    """
    Get a game configuration by key.
    """
    return db.query(GameConfig).filter(GameConfig.key == key).first()


def update_config(db: Session, db_config: GameConfig, config_in: GameConfigUpdate) -> GameConfig:
    """
    Update a game configuration's value and active status.
    """
    if config_in.value is not None:
        db_config.value = config_in.value
    if config_in.is_active is not None:
        db_config.is_active = config_in.is_active
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config


def get_categories(db: Session) -> List[GameConfigCategory]:
    """
    List all game configuration categories.
    """
    return db.query(GameConfigCategory).all()
