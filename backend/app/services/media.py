import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.portfolio import MediaItem, PortfolioSection, PortfolioItem
from app.schemas.media import MediaItemCreate


def get_or_create_default_portfolio_item(db: Session) -> uuid.UUID:
    """
    Ensure a default portfolio item exists to link media manager uploads to,
    since the database schema requires portfolio_item_id to be non-null.
    """
    # 1. Get or create Global Section
    sec = db.query(PortfolioSection).filter(PortfolioSection.slug == "global").first()
    if not sec:
        sec = PortfolioSection(
            name="Global Assets Section",
            slug="global",
            icon="📁",
            allowed_content_types=["image", "video", "raw"],
            display_order=9999,
            is_active=True
        )
        db.add(sec)
        db.commit()
        db.refresh(sec)
        
    # 2. Get or create Global Item
    item = db.query(PortfolioItem).filter(
        PortfolioItem.section_id == sec.id,
        PortfolioItem.title == "Global Assets Library"
    ).first()
    if not item:
        item = PortfolioItem(
            section_id=sec.id,
            title="Global Assets Library",
            description="Default repository for media library assets",
            status="published",
            display_order=9999
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        
    return item.id


def get_media_items(db: Session) -> List[MediaItem]:
    """
    List all active (non-soft-deleted) media items.
    """
    return db.query(MediaItem).filter(MediaItem.is_deleted == False).order_by(MediaItem.created_at.desc()).all()


def get_media_item(db: Session, media_id: uuid.UUID) -> Optional[MediaItem]:
    """
    Retrieve a media item by its ID.
    """
    return db.query(MediaItem).filter(MediaItem.id == media_id, MediaItem.is_deleted == False).first()


def create_media_item(db: Session, media_in: MediaItemCreate) -> MediaItem:
    """
    Create a new MediaItem database record.
    """
    db_media = MediaItem(
        portfolio_item_id=media_in.portfolio_item_id,
        cloudinary_public_id=media_in.cloudinary_public_id,
        secure_url=media_in.secure_url,
        resource_type=media_in.resource_type,
        file_format=media_in.file_format,
        file_size=media_in.file_size,
        width=media_in.width,
        height=media_in.height,
        display_order=media_in.display_order
    )
    db.add(db_media)
    db.commit()
    db.refresh(db_media)
    return db_media


def delete_media_item(db: Session, db_media: MediaItem) -> None:
    """
    Permanently delete a MediaItem database record.
    """
    db.delete(db_media)
    db.commit()
