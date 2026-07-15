import io
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database import SessionLocal
from app.config import settings
from app.services import user as user_service
from app.schemas.user import UserCreate
from app.services import portfolio as portfolio_service

client = TestClient(app)


@pytest.fixture(scope="module")
def db() -> Session:
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture(scope="module")
def admin_token(db: Session):
    existing = user_service.get_user_by_email(db, email=settings.ADMIN_EMAIL)
    if not existing:
        user_in = UserCreate(
            email=settings.ADMIN_EMAIL,
            password="adminpassword",
            is_active=True
        )
        existing = user_service.create_user(db, user_in=user_in)
    
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={"email": settings.ADMIN_EMAIL, "password": "adminpassword"}
    )
    return response.json()["access_token"]


@pytest.fixture(scope="module")
def headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def test_section_crud_and_reordering(headers, db):
    # 1. Create sections
    payload1 = {
        "name": "Art and Design",
        "slug": "art-design",
        "icon": "🎨",
        "allowed_content_types": ["image", "text"],
        "display_order": 1,
        "is_active": True
    }
    response1 = client.post(f"{settings.API_V1_STR}/portfolio/sections", json=payload1, headers=headers)
    assert response1.status_code == 201
    sec1 = response1.json()
    assert sec1["name"] == "Art and Design"
    assert sec1["slug"] == "art-design"

    payload2 = {
        "name": "Game Dev Log",
        "slug": "gamedev-log",
        "icon": "🕹️",
        "allowed_content_types": ["text", "video"],
        "display_order": 2,
        "is_active": True
    }
    response2 = client.post(f"{settings.API_V1_STR}/portfolio/sections", json=payload2, headers=headers)
    assert response2.status_code == 201
    sec2 = response2.json()

    # 2. Update section
    update_payload = {"name": "Art & Design (Updated)"}
    response_update = client.put(f"{settings.API_V1_STR}/portfolio/sections/{sec1['id']}", json=update_payload, headers=headers)
    assert response_update.status_code == 200
    assert response_update.json()["name"] == "Art & Design (Updated)"

    # 3. Reorder sections
    reorder_payload = [sec2["id"], sec1["id"]]
    response_reorder = client.post(f"{settings.API_V1_STR}/portfolio/sections/reorder", json=reorder_payload, headers=headers)
    assert response_reorder.status_code == 200
    assert response_reorder.json()["message"] == "Sections reordered successfully"

    # Verify list order
    response_list = client.get(f"{settings.API_V1_STR}/portfolio/sections")
    assert response_list.status_code == 200
    sections = response_list.json()
    custom_secs = [s for s in sections if s["slug"] in ["art-design", "gamedev-log"]]
    assert len(custom_secs) == 2
    assert custom_secs[0]["slug"] == "gamedev-log"
    assert custom_secs[1]["slug"] == "art-design"

    # Clean up
    db_sec1 = portfolio_service.get_section(db, uuid.UUID(sec1["id"]))
    db_sec2 = portfolio_service.get_section(db, uuid.UUID(sec2["id"]))
    if db_sec1:
        db.delete(db_sec1)
    if db_sec2:
        db.delete(db_sec2)
    db.commit()


def test_item_crud_and_version_history(headers, db):
    # Create temporary section
    sec_payload = {
        "name": "Projects Temp",
        "slug": "projects-temp",
        "icon": "🚀",
        "allowed_content_types": ["image"],
        "display_order": 0,
        "is_active": True
    }
    sec_response = client.post(f"{settings.API_V1_STR}/portfolio/sections", json=sec_payload, headers=headers)
    sec_id = sec_response.json()["id"]

    # 1. Create item
    item_payload = {
        "section_id": sec_id,
        "title": "My Awesome Game Project",
        "description": "This is a description",
        "content_body": "Full body text",
        "custom_metadata": {"engine": "Unity"},
        "status": "draft",
        "display_order": 0
    }
    response = client.post(f"{settings.API_V1_STR}/portfolio/items", json=item_payload, headers=headers)
    assert response.status_code == 201
    item = response.json()
    assert item["title"] == "My Awesome Game Project"
    assert item["current_version"] == 1

    # 2. Update item (generates new version)
    update_payload = {
        "title": "My Awesome Game Project (V2)",
        "description": "Updated description"
    }
    response_update = client.put(f"{settings.API_V1_STR}/portfolio/items/{item['id']}", json=update_payload, headers=headers)
    assert response_update.status_code == 200
    assert response_update.json()["title"] == "My Awesome Game Project (V2)"
    assert response_update.json()["current_version"] == 2

    # 3. Version history
    response_history = client.get(f"{settings.API_V1_STR}/portfolio/items/{item['id']}/history", headers=headers)
    assert response_history.status_code == 200
    history = response_history.json()
    assert len(history) == 2
    assert history[0]["version_number"] == 2
    assert history[0]["title"] == "My Awesome Game Project (V2)"
    assert history[1]["version_number"] == 1
    assert history[1]["title"] == "My Awesome Game Project"

    # 4. Soft Delete
    response_delete = client.delete(f"{settings.API_V1_STR}/portfolio/items/{item['id']}", headers=headers)
    assert response_delete.status_code == 200
    assert response_delete.json()["is_deleted"] is True

    # Verify standard filtering
    response_list_normal = client.get(f"{settings.API_V1_STR}/portfolio/items?section_id={sec_id}")
    assert len(response_list_normal.json()) == 0

    response_list_deleted = client.get(
        f"{settings.API_V1_STR}/portfolio/items?section_id={sec_id}&include_deleted=true",
        headers=headers
    )
    assert len(response_list_deleted.json()) == 1

    # 5. Restore
    response_restore = client.post(f"{settings.API_V1_STR}/portfolio/items/{item['id']}/restore", headers=headers)
    assert response_restore.status_code == 200
    assert response_restore.json()["is_deleted"] is False

    # Clean up
    db_item = portfolio_service.get_item(db, uuid.UUID(item["id"]))
    db_sec = portfolio_service.get_section(db, uuid.UUID(sec_id))
    if db_item:
        db.query(portfolio_service.PortfolioItemVersion).filter_by(portfolio_item_id=db_item.id).delete()
        db.delete(db_item)
    if db_sec:
        db.delete(db_sec)
    db.commit()


def test_media_manager_and_storage_provider(headers, db):
    file_content = b"test file content for local storage provider uploads"
    file_name = "test_image.png"
    files = {"file": (file_name, io.BytesIO(file_content), "image/png")}
    
    # 1. Upload
    response_upload = client.post(f"{settings.API_V1_STR}/media/upload", files=files, headers=headers)
    assert response_upload.status_code == 201
    media = response_upload.json()
    assert media["secure_url"].startswith("/static/uploads/")
    assert media["file_format"] == "png"
    assert media["file_size"] == len(file_content)

    # 2. List
    response_list = client.get(f"{settings.API_V1_STR}/media/", headers=headers)
    assert response_list.status_code == 200
    media_list = response_list.json()
    assert any(m["id"] == media["id"] for m in media_list)

    # 3. Delete
    response_delete = client.delete(f"{settings.API_V1_STR}/media/{media['id']}", headers=headers)
    assert response_delete.status_code == 200
    assert response_delete.json()["message"] == "Media item deleted successfully"


def test_public_slug_lookups(headers, db):
    # 1. Create a section
    sec_payload = {
        "name": "Lookups Section",
        "slug": "lookups-sec",
        "icon": "🔮",
        "allowed_content_types": ["text"],
        "display_order": 0,
        "is_active": True
    }
    sec_response = client.post(f"{settings.API_V1_STR}/portfolio/sections", json=sec_payload, headers=headers)
    assert sec_response.status_code == 201
    sec = sec_response.json()

    # 2. Create a published item under it
    item_payload = {
        "section_id": sec["id"],
        "title": "A Fine Masterpiece Project",
        "description": "Short desc",
        "content_body": "Long body",
        "custom_metadata": {"slug": "custom-art-slug"},
        "status": "published",
        "display_order": 0
    }
    item_response = client.post(f"{settings.API_V1_STR}/portfolio/items", json=item_payload, headers=headers)
    assert item_response.status_code == 201
    item = item_response.json()

    # 3. Retrieve section by slug
    response_sec = client.get(f"{settings.API_V1_STR}/portfolio/sections/by-slug/lookups-sec")
    assert response_sec.status_code == 200
    assert response_sec.json()["id"] == sec["id"]

    # 4. Retrieve item by metadata custom slug
    response_item1 = client.get(f"{settings.API_V1_STR}/portfolio/items/by-slug/custom-art-slug")
    assert response_item1.status_code == 200
    assert response_item1.json()["id"] == item["id"]

    # 5. Retrieve item by dynamically computed title slug
    response_item2 = client.get(f"{settings.API_V1_STR}/portfolio/items/by-slug/a-fine-masterpiece-project")
    assert response_item2.status_code == 200
    assert response_item2.json()["id"] == item["id"]

    # Clean up
    db_item = portfolio_service.get_item(db, uuid.UUID(item["id"]))
    db_sec = portfolio_service.get_section(db, uuid.UUID(sec["id"]))
    if db_item:
        db.query(portfolio_service.PortfolioItemVersion).filter_by(portfolio_item_id=db_item.id).delete()
        db.delete(db_item)
    if db_sec:
        db.delete(db_sec)
    db.commit()

