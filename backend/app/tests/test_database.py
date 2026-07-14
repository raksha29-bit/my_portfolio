from sqlalchemy import inspect
from app.database import engine, SessionLocal
from app.models.portfolio import PortfolioSection

def test_database_tables_exist():
    """
    Verify that all expected tables are registered and successfully created via Alembic.
    """
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    expected_tables = [
        "users",
        "portfolio_sections",
        "portfolio_items",
        "portfolio_item_versions",
        "tags",
        "portfolio_item_tags",
        "media_items",
        "game_config_categories",
        "game_configs",
        "chatbot_knowledge",
        "contact_messages",
        "alembic_version"
    ]
    
    for table in expected_tables:
        assert table in tables, f"Expected table '{table}' was not found in the database."

def test_database_crud():
    """
    Verify that we can perform base CRUD operations, including parsing list/dict data
    types inside SQLite/PostgreSQL JSON mappings, and soft-delete fields.
    """
    db = SessionLocal()
    try:
        # Create a test section
        section = PortfolioSection(
            name="Testing Section",
            slug="testing-section",
            icon="🧪",
            allowed_content_types=["text"]
        )
        db.add(section)
        db.commit()
        
        # Retrieve the section
        retrieved = db.query(PortfolioSection).filter_by(slug="testing-section").first()
        assert retrieved is not None
        assert retrieved.name == "Testing Section"
        assert retrieved.icon == "🧪"
        assert "text" in retrieved.allowed_content_types
        
        # Soft delete flag check
        assert retrieved.is_deleted is False
        assert retrieved.deleted_at is None
        
        # Cleanup
        db.delete(retrieved)
        db.commit()
    finally:
        db.close()
