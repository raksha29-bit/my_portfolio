from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.models.base import BaseModelMixin

class ChatbotKnowledge(Base, BaseModelMixin):
    """
    RAG support context elements mapped to terms/queries to tutor Sakura.
    """
    __tablename__ = "chatbot_knowledge"

    category: Mapped[str] = mapped_column(String(100), default="general") # e.g. project, persona, timeline
    question_or_keyword: Mapped[str] = mapped_column(Text, nullable=False)
    answer_context: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True)
