import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database import SessionLocal
from app.core import security
from app.config import settings
from app.services import user as user_service
from app.schemas.user import UserCreate

client = TestClient(app)


@pytest.fixture(scope="module")
def db() -> Session:
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture(scope="module")
def test_admin(db: Session):
    existing = user_service.get_user_by_email(db, email=settings.ADMIN_EMAIL)
    if existing:
        db.delete(existing)
        db.commit()

    user_in = UserCreate(
        email=settings.ADMIN_EMAIL,
        password="supersecretadminpassword",
        is_active=True
    )
    user = user_service.create_user(db, user_in=user_in)
    yield user
    db.delete(user)
    db.commit()


@pytest.fixture(scope="module")
def test_regular_user(db: Session):
    email = "user@example.com"
    existing = user_service.get_user_by_email(db, email=email)
    if existing:
        db.delete(existing)
        db.commit()

    user_in = UserCreate(
        email=email,
        password="regularpassword",
        is_active=True
    )
    user = user_service.create_user(db, user_in=user_in)
    yield user
    db.delete(user)
    db.commit()


def test_password_hashing():
    password = "my-test-password"
    hashed = security.get_password_hash(password)
    assert hashed != password
    assert security.verify_password(password, hashed) is True
    assert security.verify_password("wrong-password", hashed) is False


def test_jwt_generation():
    subject = "test-subject"
    token = security.create_access_token(subject)
    assert token is not None
    import jwt
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["sub"] == subject


def test_login_oauth2_success(test_admin):
    response = client.post(
        f"{settings.API_V1_STR}/auth/login/access-token",
        data={
            "username": settings.ADMIN_EMAIL,
            "password": "supersecretadminpassword"
        }
    )
    assert response.status_code == 200
    json_data = response.json()
    assert "access_token" in json_data
    assert json_data["token_type"] == "bearer"
    assert "access_token" in response.cookies


def test_login_json_success(test_admin):
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={
            "email": settings.ADMIN_EMAIL,
            "password": "supersecretadminpassword"
        }
    )
    assert response.status_code == 200
    json_data = response.json()
    assert "access_token" in json_data
    assert "access_token" in response.cookies


def test_login_invalid_credentials(test_admin):
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={
            "email": settings.ADMIN_EMAIL,
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Incorrect email or password"


def test_logout(test_admin):
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={
            "email": settings.ADMIN_EMAIL,
            "password": "supersecretadminpassword"
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.cookies

    logout_response = client.post(f"{settings.API_V1_STR}/auth/logout")
    assert logout_response.status_code == 200
    cookie = logout_response.cookies.get("access_token")
    assert cookie is None or cookie == ""


def test_protected_route_admin_success(test_admin):
    login_response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={
            "email": settings.ADMIN_EMAIL,
            "password": "supersecretadminpassword"
        }
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    me_response = client.get(f"{settings.API_V1_STR}/auth/me", headers=headers)
    assert me_response.status_code == 200
    assert me_response.json()["email"] == settings.ADMIN_EMAIL

    client.cookies.clear()
    client.cookies.set("access_token", token)
    me_response_cookie = client.get(f"{settings.API_V1_STR}/auth/me")
    assert me_response_cookie.status_code == 200
    assert me_response_cookie.json()["email"] == settings.ADMIN_EMAIL
    client.cookies.clear()


def test_protected_route_non_admin_forbidden(test_regular_user):
    login_response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={
            "email": test_regular_user.email,
            "password": "regularpassword"
        }
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    me_response = client.get(f"{settings.API_V1_STR}/auth/me", headers=headers)
    assert me_response.status_code == 403
    assert me_response.json()["detail"] == "The user does not have administrative privileges"
    client.cookies.clear()


def test_protected_route_unauthorized():
    client.cookies.clear()
    me_response = client.get(f"{settings.API_V1_STR}/auth/me")
    assert me_response.status_code == 401
    assert me_response.json()["detail"] == "Not authenticated"



def test_version_history_route_missing_item(test_admin):
    login_response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={
            "email": settings.ADMIN_EMAIL,
            "password": "supersecretadminpassword"
        }
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    item_id = uuid.uuid4()
    history_response = client.get(
        f"{settings.API_V1_STR}/portfolio/items/{item_id}/history",
        headers=headers
    )
    assert history_response.status_code == 404
    assert history_response.json()["detail"] == "Portfolio item not found."

