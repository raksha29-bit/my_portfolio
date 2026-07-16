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
from app.models.user import User

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
            "email_or_username": settings.ADMIN_EMAIL,
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
            "email_or_username": settings.ADMIN_EMAIL,
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 400
    assert "Incorrect email/username or password" in response.json()["detail"]


def test_logout(test_admin):
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={
            "email_or_username": settings.ADMIN_EMAIL,
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
            "email_or_username": settings.ADMIN_EMAIL,
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


def test_protected_route_non_admin_forbidden(test_regular_user, db: Session):
    # Make sure they are not admin
    test_regular_user.is_admin = False
    db.add(test_regular_user)
    db.commit()

    login_response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={
            "email_or_username": test_regular_user.email,
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
            "email_or_username": settings.ADMIN_EMAIL,
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


# --- NEW HARDENING TESTS ---

def test_login_by_username(db: Session, test_admin):
    # Set a username for test_admin
    test_admin.username = "admin_user_test"
    db.add(test_admin)
    db.commit()
    db.refresh(test_admin)

    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={
            "email_or_username": "admin_user_test",
            "password": "supersecretadminpassword"
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_brute_force_lockout(db: Session):
    # Clean up any leftover users from previous failed runs
    existing_email = user_service.get_user_by_email(db, email="bruteforce@example.com")
    if existing_email:
        db.delete(existing_email)
        db.commit()
    existing_username = db.query(User).filter(User.username == "bruteforce").first()
    if existing_username:
        db.delete(existing_username)
        db.commit()

    # Create a temporary user to lock out
    email = "bruteforce@example.com"
    user_in = UserCreate(
        email=email,
        username="bruteforce",
        password="correctpassword",
        is_active=True
    )
    user = user_service.create_user(db, user_in=user_in)

    # Fail login 5 times
    for _ in range(5):
        client.post(
            f"{settings.API_V1_STR}/auth/login",
            json={
                "email_or_username": email,
                "password": "wrongpassword"
            }
        )

    # The 6th attempt should return 400 with a lock out message
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={
            "email_or_username": email,
            "password": "correctpassword"
        }
    )
    assert response.status_code == 400
    assert "locked" in response.json()["detail"]

    # Cleanup
    db.delete(user)
    db.commit()


def test_password_change_verification(db: Session, test_admin):
    # Log in
    login_response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={
            "email_or_username": test_admin.email,
            "password": "supersecretadminpassword"
        }
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Incorret current password
    response = client.put(
        f"{settings.API_V1_STR}/auth/change-password",
        json={
            "current_password": "wrongcurrentpassword",
            "new_password": "newpassword123",
            "password_confirm": "newpassword123"
        },
        headers=headers
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Incorrect current password"

    # Mismatched confirmation password
    response = client.put(
        f"{settings.API_V1_STR}/auth/change-password",
        json={
            "current_password": "supersecretadminpassword",
            "new_password": "newpassword123",
            "password_confirm": "mismatchednewpassword"
        },
        headers=headers
    )
    assert response.status_code == 400
    assert "do not match" in response.json()["detail"]

    # Success password change
    response = client.put(
        f"{settings.API_V1_STR}/auth/change-password",
        json={
            "current_password": "supersecretadminpassword",
            "new_password": "newpassword123",
            "password_confirm": "newpassword123"
        },
        headers=headers
    )
    assert response.status_code == 200

    # Old password no longer works
    login_old = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={
            "email_or_username": test_admin.email,
            "password": "supersecretadminpassword"
        }
    )
    assert login_old.status_code == 400

    # New password works
    login_new = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={
            "email_or_username": test_admin.email,
            "password": "newpassword123"
        }
    )
    assert login_new.status_code == 200

    # Restore password for test consistency
    db.refresh(test_admin)
    test_admin.hashed_password = security.get_password_hash("supersecretadminpassword")
    db.add(test_admin)
    db.commit()


def test_token_version_invalidation(db: Session, test_admin):
    # Log in and get token
    login_response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        json={
            "email_or_username": test_admin.email,
            "password": "supersecretadminpassword"
        }
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify token works initially
    me_response = client.get(f"{settings.API_V1_STR}/auth/me", headers=headers)
    assert me_response.status_code == 200

    # Logout all devices (invalidates token_version)
    logout_response = client.post(f"{settings.API_V1_STR}/auth/logout-all-devices", headers=headers)
    assert logout_response.status_code == 200

    # Token should now be rejected as expired/invalidated
    me_response_invalid = client.get(f"{settings.API_V1_STR}/auth/me", headers=headers)
    assert me_response_invalid.status_code == 401
    assert "expired" in me_response_invalid.json()["detail"]


def test_setup_admin_disables_itself(db: Session):
    # Verify setup status says setup_required is False because test_admin exists
    status_response = client.get(f"{settings.API_V1_STR}/auth/setup-status")
    assert status_response.status_code == 200
    assert status_response.json()["setup_required"] is False

    # Attempt to use setup endpoint should return 403 Forbidden
    response = client.post(
        f"{settings.API_V1_STR}/auth/setup-admin",
        json={
            "email": "newadmin@example.com",
            "username": "newadmin",
            "password": "newpassword",
            "display_name": "New Admin"
        }
    )
    assert response.status_code == 403
    assert "Setup is permanently disabled" in response.json()["detail"]

