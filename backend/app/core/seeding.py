import re
from sqlalchemy.orm import Session
from app.config import settings
from app.models.user import User
from app.models.portfolio import PortfolioSection, PortfolioItem, PortfolioItemVersion
from app.services import user as user_service
from app.schemas.user import UserCreate

def seed_database(db: Session):
    # 1. Seed Default Admin User
    user_count = db.query(User).count()
    if user_count == 0:
        user_in = UserCreate(
            email=settings.ADMIN_EMAIL,
            username="admin",
            display_name="Admin",
            password="adminpassword",
            is_active=True
        )
        admin = user_service.create_user(db, user_in=user_in)

    # 2. Define target sections
    target_sections = [
        {
            "name": "🌸 About Me",
            "slug": "about-me",
            "icon": "🌸",
            "allowed_content_types": ["text", "image"],
            "display_order": 1,
        },
        {
            "name": "🚀 Projects",
            "slug": "projects",
            "icon": "🚀",
            "allowed_content_types": ["text", "image", "video"],
            "display_order": 2,
        },
        {
            "name": "🎨 Artwork",
            "slug": "artwork",
            "icon": "🎨",
            "allowed_content_types": ["text", "image", "video"],
            "display_order": 3,
        },
        {
            "name": "🛠 Skills & Tech",
            "slug": "skills-tech",
            "icon": "🛠",
            "allowed_content_types": ["text"],
            "display_order": 4,
        },
        {
            "name": "🏆 Achievements",
            "slug": "achievements",
            "icon": "🏆",
            "allowed_content_types": ["text", "image"],
            "display_order": 5,
        },
        {
            "name": "📄 Resume",
            "slug": "resume",
            "icon": "📄",
            "allowed_content_types": ["text", "raw"],
            "display_order": 6,
        },
        {
            "name": "📬 Contact",
            "slug": "contact",
            "icon": "📬",
            "allowed_content_types": ["text"],
            "display_order": 7,
        },
    ]

    # 3. Seed missing sections (idempotent, leave existing untouched)
    for sec_data in target_sections:
        existing_sec = db.query(PortfolioSection).filter(
            PortfolioSection.slug == sec_data["slug"]
        ).first()
        if not existing_sec:
            db_sec = PortfolioSection(
                name=sec_data["name"],
                slug=sec_data["slug"],
                icon=sec_data["icon"],
                allowed_content_types=sec_data["allowed_content_types"],
                display_order=sec_data["display_order"],
                is_active=True
            )
            db.add(db_sec)
            db.flush()



    db.commit()
