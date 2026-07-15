import re
from sqlalchemy.orm import Session
from app.config import settings
from app.models.user import User
from app.models.portfolio import PortfolioSection, PortfolioItem, PortfolioItemVersion
from app.services import user as user_service
from app.schemas.user import UserCreate

def seed_database(db: Session):
    # 1. Seed Default Admin User
    admin = user_service.get_user_by_email(db, email=settings.ADMIN_EMAIL)
    if not admin:
        user_in = UserCreate(
            email=settings.ADMIN_EMAIL,
            password="adminpassword",
            is_active=True
        )
        admin = user_service.create_user(db, user_in=user_in)

    # 2. Check if custom sections already exist (excluding 'global', including soft-deleted ones)
    custom_secs = db.query(PortfolioSection).filter(
        PortfolioSection.slug != "global"
    ).count()

    if custom_secs > 0:
        # Database already has custom content or has been seeded before, skip seeding
        return

    # 3. Create Sample Sections
    sections_data = [
        {
            "name": "Projects",
            "slug": "projects",
            "icon": "🚀",
            "allowed_content_types": ["text", "image", "video"],
            "display_order": 1,
            "items": [
                {
                    "title": "Cycle.ai App",
                    "description": "AI-driven wellness predictions and cycling navigation companion.",
                    "content_body": """# Cycle.ai

An intelligent, interactive mobile application designed for urban cyclists.

## Core Features
- **Smart Predictions**: Anticipates route preferences based on historical travel data and weather patterns.
- **Wellness Score**: Integrates biosensor telemetry (heart rate, respiration) to assess physical stress and recovery.
- **Magical Navigation**: A celestial compass-inspired map overlay to guide riders along scenic paths.

```typescript
// Telemetry parser interface
interface CyclistTelemetry {
  heartRate: number;
  cadence: number;
  timestamp: Date;
}
```
""",
                    "custom_metadata": {
                        "tags": ["AI", "React Native", "Mobile"],
                        "slug": "cycle-ai",
                        "demo_url": "https://example.com/cycle-ai"
                    }
                }
            ]
        },
        {
            "name": "Artwork",
            "slug": "artwork",
            "icon": "🎨",
            "allowed_content_types": ["image", "text"],
            "display_order": 2,
            "items": [
                {
                    "title": "Lily Watercolor",
                    "description": "A peaceful analog watercolor study of water lilies on cold-press canvas.",
                    "content_body": """# Lily Watercolor

A traditional painting capturing light reflection and watercolor bleeding effects across pond vegetation.

## Details
- **Medium**: Watercolor and Gouache on cold-press paper.
- **Dimensions**: 12" x 16"
- **Inspiration**: Monet's water lily gardens in Giverny, rendered with modern soft pink highlights.
""",
                    "custom_metadata": {
                        "tags": ["Analog Art", "Watercolor", "Painting"],
                        "slug": "lily-watercolor"
                    }
                }
            ]
        },
        {
            "name": "Resume",
            "slug": "resume",
            "icon": "📄",
            "allowed_content_types": ["text"],
            "display_order": 3,
            "items": [
                {
                    "title": "Technical Resume",
                    "description": "Professional history, programming skills, and core engineering expertise.",
                    "content_body": """# Sakura Haruno
*Game Developer & Creative Engineer*

Welcome to my archive. I bridge the gap between creative visual designs and high-performance gameplay systems.

## Professional Experience

### Lead Creative Engineer
*NeoGamer Studio • 2024 - Present*
- Architected the dialog and narration scripting systems for an upcoming fantasy puzzle game.
- Optimized canvas layout rendering, reducing mobile frame drops by 15%.

### Gameplay Programmer
*PixelForge Interactive • 2022 - 2024*
- Implemented character control engines and collision systems.
- Maintained core gameplay loops in C++ and C#.

---

## Technical Skills
- **Languages**: JavaScript, TypeScript, Python, C++, C#
- **Frameworks**: React, Next.js, FastAPI, Unity, Unreal Engine
- **Aesthetics**: Glassmorphism, CSS layouts, Celestial art directions
""",
                    "custom_metadata": {
                        "tags": ["Resume", "Qualifications", "Career"],
                        "slug": "technical-resume"
                    }
                }
            ]
        }
    ]

    for sec_info in sections_data:
        # Create Section
        db_sec = PortfolioSection(
            name=sec_info["name"],
            slug=sec_info["slug"],
            icon=sec_info["icon"],
            allowed_content_types=sec_info["allowed_content_types"],
            display_order=sec_info["display_order"],
            is_active=True
        )
        db.add(db_sec)
        db.flush() # Populate db_sec.id

        # Create Items
        for item_info in sec_info["items"]:
            db_item = PortfolioItem(
                section_id=db_sec.id,
                title=item_info["title"],
                description=item_info["description"],
                content_body=item_info["content_body"],
                custom_metadata=item_info["custom_metadata"],
                status="published",
                display_order=0,
                current_version=1
            )
            db.add(db_item)
            db.flush()

            # Create Version History Snapshot
            db_version = PortfolioItemVersion(
                portfolio_item_id=db_item.id,
                version_number=1,
                title=db_item.title,
                description=db_item.description,
                content_body=db_item.content_body,
                custom_metadata=db_item.custom_metadata,
                created_by_user_id=admin.id
            )
            db.add(db_version)

    db.commit()
