import uuid
from typing import List, Optional
from sqlalchemy import Table, Column, String, Integer, Text, ForeignKey, JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import BaseModelMixin

# Association table for many-to-many relationship between PortfolioItems and Tags
portfolio_item_tags = Table(
    "portfolio_item_tags",
    Base.metadata,
    Column(
        "portfolio_item_id",
        Uuid,
        ForeignKey("portfolio_items.id", ondelete="CASCADE"),
        primary_key=True
    ),
    Column(
        "tag_id",
        Uuid,
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True
    )
)

class PortfolioSection(Base, BaseModelMixin):
    """
    Dynamic sections system (e.g. Projects, Resume, Artworks, or Photography).
    Allows creating entirely new visual zones via the database.
    """
    __tablename__ = "portfolio_sections"

    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    allowed_content_types: Mapped[list] = mapped_column(JSON, default=list) # e.g. ["image", "video", "text"]
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(default=True)

    items: Mapped[List["PortfolioItem"]] = relationship(
        "PortfolioItem",
        back_populates="section",
        cascade="all, delete-orphan"
    )

class PortfolioItem(Base, BaseModelMixin):
    """
    Generic Content Engine entity. Inherited structures share common schema properties.
    Dynamic custom formats map into JSON columns.
    """
    __tablename__ = "portfolio_items"

    section_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("portfolio_sections.id", ondelete="CASCADE"),
        nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content_body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    custom_metadata: Mapped[dict] = mapped_column(JSON, default=dict) # Catch-all for custom parameters
    status: Mapped[str] = mapped_column(String(50), default="draft") # draft, published
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    current_version: Mapped[int] = mapped_column(Integer, default=1)

    section: Mapped["PortfolioSection"] = relationship("PortfolioSection", back_populates="items")
    versions: Mapped[List["PortfolioItemVersion"]] = relationship(
        "PortfolioItemVersion",
        back_populates="portfolio_item",
        cascade="all, delete-orphan"
    )
    media_items: Mapped[List["MediaItem"]] = relationship(
        "MediaItem",
        back_populates="portfolio_item",
        cascade="all, delete-orphan"
    )
    tags: Mapped[List["Tag"]] = relationship(
        "Tag",
        secondary=portfolio_item_tags,
        back_populates="portfolio_items"
    )

class PortfolioItemVersion(Base, BaseModelMixin):
    """
    Tracks historical revision updates for important CMS content.
    """
    __tablename__ = "portfolio_item_versions"

    portfolio_item_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("portfolio_items.id", ondelete="CASCADE"),
        nullable=False
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content_body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    custom_metadata: Mapped[dict] = mapped_column(JSON, default=dict)
    created_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    portfolio_item: Mapped["PortfolioItem"] = relationship("PortfolioItem", back_populates="versions")

class Tag(Base):
    """
    Normalized Tag system for high-performance indexing, search, and analytics.
    """
    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)

    portfolio_items: Mapped[List["PortfolioItem"]] = relationship(
        "PortfolioItem",
        secondary=portfolio_item_tags,
        back_populates="tags"
    )

class MediaItem(Base, BaseModelMixin):
    """
    Tracks metadata of uploaded Cloudinary items without storing raw files in database.
    """
    __tablename__ = "media_items"

    portfolio_item_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("portfolio_items.id", ondelete="CASCADE"),
        nullable=False
    )
    cloudinary_public_id: Mapped[str] = mapped_column(String(255), nullable=False)
    secure_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. image, video, raw
    file_format: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)

    portfolio_item: Mapped["PortfolioItem"] = relationship("PortfolioItem", back_populates="media_items")
