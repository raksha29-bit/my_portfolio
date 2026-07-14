from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.models.base import BaseModelMixin

class ContactMessage(Base, BaseModelMixin):
    """
    Visitor inquiry form storage database schema.
    """
    __tablename__ = "contact_messages"

    sender_name: Mapped[str] = mapped_column(String(255), nullable=False)
    sender_email: Mapped[str] = mapped_column(String(255), nullable=False)
    message_content: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(default=False)
