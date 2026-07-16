import os

# Redirect database connection to test database BEFORE any app modules are loaded
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

import pytest
from app.database import engine, SessionLocal, Base
from app.core.seeding import seed_database
from alembic.config import Config
from alembic import command

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Run Alembic migrations programmatically on test.db
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")
    
    # Seed the default sections
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
        
    yield
    
    # Cleanup after session
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except Exception:
            pass
