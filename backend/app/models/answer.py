from sqlalchemy import Column, BigInteger, Date, SmallInteger, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.types import TypeDecorator
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.security import security
from app.core.ulid import BinaryULID, generate_ulid

class EncryptedText(TypeDecorator):
    # 保存時に暗号化し、取得時に復号化する型
    impl = Text

    def process_bind_param(self, value, dialect):
        if value is not None:
            return security.encrypt(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return security.decrypt(value)
        return value

class Answer(Base):
    __tablename__ = "answers"

    id = Column(BinaryULID, primary_key=True, default=generate_ulid)
    user_id = Column(BinaryULID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(BinaryULID, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    answer_date = Column(Date, nullable=False)
    rating = Column(SmallInteger)
    free_text = Column(EncryptedText) # 暗号化カスタム型を使用
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "question_id", "answer_date", name="uk_user_question_date"),
    )

    user = relationship("User")
    question = relationship("Question")
