import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.portfolio import PortfolioSection, PortfolioItem, PortfolioItemVersion
from app.schemas.portfolio import (
    PortfolioSectionCreate,
    PortfolioSectionUpdate,
    PortfolioItemCreate,
    PortfolioItemUpdate,
)


# ==============================================================================
# Portfolio Sections
# ==============================================================================

def get_sections(db: Session, include_inactive: bool = True) -> List[PortfolioSection]:
    """
    List all portfolio sections, ordered by display_order.
    """
    query = db.query(PortfolioSection).filter(PortfolioSection.is_deleted == False)
    if not include_inactive:
        query = query.filter(PortfolioSection.is_active == True)
    return query.order_by(PortfolioSection.display_order.asc()).all()


def get_section(db: Session, section_id: uuid.UUID) -> Optional[PortfolioSection]:
    """
    Get a portfolio section by ID.
    """
    return db.query(PortfolioSection).filter(
        PortfolioSection.id == section_id,
        PortfolioSection.is_deleted == False
    ).first()


def get_section_by_slug(db: Session, slug: str) -> Optional[PortfolioSection]:
    """
    Get a portfolio section by slug.
    """
    return db.query(PortfolioSection).filter(
        PortfolioSection.slug == slug,
        PortfolioSection.is_deleted == False
    ).first()


def create_section(db: Session, section_in: PortfolioSectionCreate) -> PortfolioSection:
    """
    Create a new portfolio section.
    """
    db_section = PortfolioSection(
        name=section_in.name,
        slug=section_in.slug,
        icon=section_in.icon,
        allowed_content_types=section_in.allowed_content_types,
        display_order=section_in.display_order,
        is_active=section_in.is_active,
    )
    db.add(db_section)
    db.commit()
    db.refresh(db_section)
    return db_section


def update_section(
    db: Session, db_section: PortfolioSection, section_in: PortfolioSectionUpdate
) -> PortfolioSection:
    """
    Update details of a portfolio section.
    """
    for field in ["name", "slug", "icon", "allowed_content_types", "display_order", "is_active"]:
        val = getattr(section_in, field)
        if val is not None:
            setattr(db_section, field, val)
    db.add(db_section)
    db.commit()
    db.refresh(db_section)
    return db_section


def reorder_sections(db: Session, section_ids: List[uuid.UUID]) -> bool:
    """
    Update display orders for a list of section IDs.
    """
    for idx, sec_id in enumerate(section_ids):
        db.query(PortfolioSection).filter(PortfolioSection.id == sec_id).update(
            {"display_order": idx}
        )
    db.commit()
    return True


# ==============================================================================
# Portfolio Items
# ==============================================================================

def enforce_single_active_resume(db: Session, section_id: uuid.UUID, current_item_id: Optional[uuid.UUID] = None):
    # Fetch section to verify slug
    sec = db.query(PortfolioSection).filter(PortfolioSection.id == section_id, PortfolioSection.is_deleted == False).first()
    if sec and sec.slug == "resume":
        # Find all other published items in this section and set them to draft
        query = db.query(PortfolioItem).filter(
            PortfolioItem.section_id == section_id,
            PortfolioItem.status == "published",
            PortfolioItem.is_deleted == False
        )
        if current_item_id:
            query = query.filter(PortfolioItem.id != current_item_id)
        other_items = query.all()
        for item in other_items:
            item.status = "draft"
            item.current_version += 1
            db.add(item)
            db.flush()
            db_version = PortfolioItemVersion(
                portfolio_item_id=item.id,
                version_number=item.current_version,
                title=item.title,
                description=item.description,
                content_body=item.content_body,
                custom_metadata=item.custom_metadata,
                is_featured=item.is_featured,
            )
            db.add(db_version)

def get_items(
    db: Session,
    section_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    include_deleted: bool = False,
    search: Optional[str] = None,
    is_featured: Optional[bool] = None,
) -> List[PortfolioItem]:
    """
    List portfolio items, supporting filter parameters and queries.
    """
    query = db.query(PortfolioItem)
    if not include_deleted:
        query = query.filter(PortfolioItem.is_deleted == False)
    if section_id:
        query = query.filter(PortfolioItem.section_id == section_id)
    if status:
        query = query.filter(PortfolioItem.status == status)
    if is_featured is not None:
        query = query.filter(PortfolioItem.is_featured == is_featured)
    if search:
        query = query.filter(
            (PortfolioItem.title.ilike(f"%{search}%"))
            | (PortfolioItem.description.ilike(f"%{search}%"))
        )
    return query.order_by(PortfolioItem.display_order.asc(), PortfolioItem.created_at.desc()).all()


def get_item(db: Session, item_id: uuid.UUID) -> Optional[PortfolioItem]:
    """
    Retrieve a portfolio item by ID.
    """
    return db.query(PortfolioItem).filter(
        PortfolioItem.id == item_id,
        PortfolioItem.is_deleted == False
    ).first()


def create_item(
    db: Session, item_in: PortfolioItemCreate, created_by_user_id: Optional[uuid.UUID] = None
) -> PortfolioItem:
    """
    Create a new portfolio item and its initial version snapshot (v1).
    """
    sec = db.query(PortfolioSection).filter(PortfolioSection.id == item_in.section_id, PortfolioSection.is_deleted == False).first()
    is_feat = item_in.is_featured
    if not sec or sec.slug not in ["projects", "artwork", "achievements"]:
        is_feat = False

    db_item = PortfolioItem(
        section_id=item_in.section_id,
        title=item_in.title,
        description=item_in.description,
        content_body=item_in.content_body,
        custom_metadata=item_in.custom_metadata,
        status=item_in.status,
        display_order=item_in.display_order,
        is_featured=is_feat,
        current_version=1,
    )
    db.add(db_item)
    db.flush()

    if db_item.status == "published":
        enforce_single_active_resume(db, db_item.section_id, db_item.id)

    db.commit()
    db.refresh(db_item)

    # Snapshot initial version
    db_version = PortfolioItemVersion(
        portfolio_item_id=db_item.id,
        version_number=1,
        title=db_item.title,
        description=db_item.description,
        content_body=db_item.content_body,
        custom_metadata=db_item.custom_metadata,
        is_featured=db_item.is_featured,
        created_by_user_id=created_by_user_id,
    )
    db.add(db_version)
    db.commit()
    
    return db_item


def update_item(
    db: Session,
    db_item: PortfolioItem,
    item_in: PortfolioItemUpdate,
    created_by_user_id: Optional[uuid.UUID] = None,
) -> PortfolioItem:
    """
    Update a portfolio item, incrementing the version and creating a version snapshot.
    """
    for field in ["title", "description", "content_body", "custom_metadata", "status", "display_order", "section_id", "is_featured"]:
        val = getattr(item_in, field)
        if val is not None:
            setattr(db_item, field, val)

    # Enforce allowed sections for is_featured
    sec = db.query(PortfolioSection).filter(PortfolioSection.id == db_item.section_id, PortfolioSection.is_deleted == False).first()
    if not sec or sec.slug not in ["projects", "artwork", "achievements"]:
        db_item.is_featured = False
            
    db_item.current_version += 1
    db.add(db_item)
    db.flush()

    if db_item.status == "published":
        enforce_single_active_resume(db, db_item.section_id, db_item.id)

    db.commit()
    db.refresh(db_item)

    # Snapshot new version
    db_version = PortfolioItemVersion(
        portfolio_item_id=db_item.id,
        version_number=db_item.current_version,
        title=db_item.title,
        description=db_item.description,
        content_body=db_item.content_body,
        custom_metadata=db_item.custom_metadata,
        is_featured=db_item.is_featured,
        created_by_user_id=created_by_user_id,
    )
    db.add(db_version)
    db.commit()
    
    return db_item


def soft_delete_item(db: Session, db_item: PortfolioItem) -> PortfolioItem:
    """
    Soft-delete a portfolio item.
    """
    db_item.is_deleted = True
    db_item.deleted_at = datetime.now(timezone.utc)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def restore_item(db: Session, db_item: PortfolioItem) -> PortfolioItem:
    """
    Restore a soft-deleted portfolio item.
    """
    db_item.is_deleted = False
    db_item.deleted_at = None
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def get_item_history(db: Session, item_id: uuid.UUID) -> List[PortfolioItemVersion]:
    """
    Get the version history list of an item, ordered by version descending.
    """
    return (
        db.query(PortfolioItemVersion)
        .filter(PortfolioItemVersion.portfolio_item_id == item_id)
        .order_by(PortfolioItemVersion.version_number.desc())
        .all()
    )
