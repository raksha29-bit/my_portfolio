import uuid
from typing import List
from sqlalchemy import String, ForeignKey, JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class GameConfigCategory(Base):
    """
    Groups config rules (e.g., 'dialogues', 'theme_palettes', 'scene_transitions').
    """
    __tablename__ = "game_config_categories"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)

    configs: Mapped[List["GameConfig"]] = relationship(
        "GameConfig",
        back_populates="category",
        cascade="all, delete-orphan"
    )

class GameConfig(Base):
    """
    Actual key-value settings. Values are structured JSON records for high flexibility.
    """
    __tablename__ = "game_configs"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("game_config_categories.id", ondelete="CASCADE"),
        nullable=False
    )
    key: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    value: Mapped[dict] = mapped_column(JSON, default=dict)
    is_active: Mapped[bool] = mapped_column(default=True)

    category: Mapped["GameConfigCategory"] = relationship("GameConfigCategory", back_populates="configs")
