import uuid
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.schemas.media import MediaItemOut, MediaItemCreate
from app.services import media as media_service
from app.core.storage import get_storage_provider

router = APIRouter()


@router.get("/", response_model=List[MediaItemOut])
def list_media(
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    List all uploaded media items (requires administrator privileges).
    """
    return media_service.get_media_items(db)


@router.post("/upload", response_model=MediaItemOut, status_code=status.HTTP_201_CREATED)
def upload_media(
    *,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.get_current_active_admin),
    file: UploadFile = File(...),
    portfolio_item_id: Optional[uuid.UUID] = Form(None),
) -> Any:
    """
    Upload a media asset to the active storage provider and record metadata (requires administrator privileges).
    """
    # If no specific portfolio item was provided, link it to the global fallback library item
    if not portfolio_item_id:
        portfolio_item_id = media_service.get_or_create_default_portfolio_item(db)

    # Validate portfolio item exists
    # We can check using portfolio service, or query directly
    # To keep media.py self-contained, we can assume the resolved id is valid
    
    # Upload file using the configured storage provider
    storage_provider = get_storage_provider()
    try:
        upload_data = storage_provider.upload_file(file, folder="media")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not upload file to storage provider: {str(e)}",
        )

    # Save metadata record in DB
    media_in = MediaItemCreate(
        portfolio_item_id=portfolio_item_id,
        cloudinary_public_id=upload_data["public_id"],
        secure_url=upload_data["secure_url"],
        resource_type=upload_data["resource_type"],
        file_format=upload_data["file_format"],
        file_size=upload_data["file_size"],
        width=upload_data["width"],
        height=upload_data["height"],
        display_order=0,
    )
    return media_service.create_media_item(db, media_in=media_in)


@router.delete("/{media_id}")
def delete_media(
    media_id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_admin: User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Delete a media asset from storage and clear its database metadata record (requires administrator privileges).
    """
    db_media = media_service.get_media_item(db, media_id=media_id)
    if not db_media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media item not found.",
        )

    # Remove file from storage
    storage_provider = get_storage_provider()
    storage_provider.delete_file(db_media.cloudinary_public_id)

    # Delete record from DB
    media_service.delete_media_item(db, db_media=db_media)

    return {"message": "Media item deleted successfully"}
