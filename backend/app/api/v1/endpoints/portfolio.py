import uuid
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.schemas.portfolio import (
    PortfolioSectionCreate,
    PortfolioSectionUpdate,
    PortfolioSectionOut,
    PortfolioItemCreate,
    PortfolioItemUpdate,
    PortfolioItemOut,
    PortfolioItemVersionOut,
)
from app.services import portfolio as portfolio_service

router = APIRouter()


# ==============================================================================
# Sections Endpoints
# ==============================================================================

@router.get("/sections", response_model=List[PortfolioSectionOut])
def list_sections(
    db: Session = Depends(deps.get_db),
    include_inactive: bool = True
) -> Any:
    """
    List all sections, ordered by display order.
    """
    return portfolio_service.get_sections(db, include_inactive=include_inactive)


@router.post("/sections", response_model=PortfolioSectionOut, status_code=status.HTTP_201_CREATED)
def create_section(
    *,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.get_current_active_admin),
    section_in: PortfolioSectionCreate,
) -> Any:
    """
    Create a new portfolio section (requires administrator privileges).
    """
    existing = portfolio_service.get_section_by_slug(db, slug=section_in.slug)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Section with slug '{section_in.slug}' already exists.",
        )
    return portfolio_service.create_section(db, section_in=section_in)


@router.put("/sections/{id}", response_model=PortfolioSectionOut)
def update_section(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.get_current_active_admin),
    section_in: PortfolioSectionUpdate,
) -> Any:
    """
    Update details of a portfolio section (requires administrator privileges).
    """
    db_section = portfolio_service.get_section(db, section_id=id)
    if not db_section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Section not found.",
        )
    return portfolio_service.update_section(db, db_section=db_section, section_in=section_in)


@router.post("/sections/reorder", status_code=status.HTTP_200_OK)
def reorder_sections(
    *,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.get_current_active_admin),
    section_ids: List[uuid.UUID],
) -> Any:
    """
    Reorder sections display index (requires administrator privileges).
    """
    portfolio_service.reorder_sections(db, section_ids=section_ids)
    return {"message": "Sections reordered successfully"}


# ==============================================================================
# Items Endpoints
# ==============================================================================

@router.get("/items", response_model=List[PortfolioItemOut])
def list_items(
    db: Session = Depends(deps.get_db),
    section_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    include_deleted: bool = False,
    search: Optional[str] = None,
) -> Any:
    """
    List portfolio items, supporting filter parameters and search queries.
    """
    return portfolio_service.get_items(
        db,
        section_id=section_id,
        status=status,
        include_deleted=include_deleted,
        search=search,
    )


@router.post("/items", response_model=PortfolioItemOut, status_code=status.HTTP_201_CREATED)
def create_item(
    *,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.get_current_active_admin),
    item_in: PortfolioItemCreate,
) -> Any:
    """
    Create a new portfolio item (requires administrator privileges).
    """
    db_section = portfolio_service.get_section(db, section_id=item_in.section_id)
    if not db_section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target portfolio section not found.",
        )
    return portfolio_service.create_item(db, item_in=item_in, created_by_user_id=current_admin.id)


@router.put("/items/{id}", response_model=PortfolioItemOut)
def update_item(
    id: uuid.UUID,
    *,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.get_current_active_admin),
    item_in: PortfolioItemUpdate,
) -> Any:
    """
    Update a portfolio item, creating a new version history revision (requires administrator privileges).
    """
    db_item = portfolio_service.get_item(db, item_id=id)
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio item not found.",
        )
    if item_in.section_id:
        db_section = portfolio_service.get_section(db, section_id=item_in.section_id)
        if not db_section:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target portfolio section not found.",
            )
    return portfolio_service.update_item(
        db, db_item=db_item, item_in=item_in, created_by_user_id=current_admin.id
    )


@router.delete("/items/{id}", response_model=PortfolioItemOut)
def delete_item(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Soft-delete a portfolio item (requires administrator privileges).
    """
    db_item = portfolio_service.get_item(db, item_id=id)
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio item not found.",
        )
    return portfolio_service.soft_delete_item(db, db_item=db_item)


@router.post("/items/{id}/restore", response_model=PortfolioItemOut)
def restore_item(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Restore a soft-deleted portfolio item (requires administrator privileges).
    """
    db_item = db.query(portfolio_service.PortfolioItem).filter(
        portfolio_service.PortfolioItem.id == id
    ).first()
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio item not found.",
        )
    if not db_item.is_deleted:
        return db_item
    return portfolio_service.restore_item(db, db_item=db_item)


@router.get("/items/{id}/history", response_model=List[PortfolioItemVersionOut])
def get_item_history(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Retrieve version history for a specific portfolio item (requires administrator privileges).
    """
    db_item = db.query(portfolio_service.PortfolioItem).filter(
        portfolio_service.PortfolioItem.id == id
    ).first()
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio item not found.",
        )
    # The history endpoint is now fully functional!
    return portfolio_service.get_item_history(db, item_id=id)


@router.get("/sections/by-slug/{slug}", response_model=PortfolioSectionOut)
def get_section_by_slug(
    slug: str,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Retrieve details of a portfolio section by its slug (public access).
    """
    db_section = portfolio_service.get_section_by_slug(db, slug=slug)
    if not db_section or not db_section.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Section not found or disabled.",
        )
    return db_section


@router.get("/items/by-slug/{slug}", response_model=PortfolioItemOut)
def get_item_by_slug(
    slug: str,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Retrieve a public portfolio item by its title slug or custom metadata slug (public access).
    """
    import re
    # Fetch all active (non-deleted, published) items
    items = db.query(portfolio_service.PortfolioItem).filter(
        portfolio_service.PortfolioItem.is_deleted == False,
        portfolio_service.PortfolioItem.status == "published",
    ).all()

    for item in items:
        # Match slug defined in custom metadata
        if item.custom_metadata and item.custom_metadata.get("slug") == slug:
            return item
        # Match dynamic slugified title
        computed_slug = re.sub(r"[^a-z0-9]+", "-", item.title.lower()).strip("-")
        if computed_slug == slug:
            return item

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Portfolio item not found.",
    )

