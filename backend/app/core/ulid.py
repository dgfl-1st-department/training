from ulid import ULID
from sqlalchemy.types import TypeDecorator, BINARY
from sqlalchemy.dialects.mysql import BINARY as MySQLBINARY

class BinaryULID(TypeDecorator):
    # ULIDをBINARY(16)として保存するためのカスタムSQLAlchemy型
    # Pythonでは文字列、DBではBINARY(16)
    impl = BINARY(16)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, str):
            try:
                return ULID.from_str(value).bytes
            except ValueError:
                raise ValueError(f"Invalid ULID string: {value}")
        if isinstance(value, bytes) and len(value) == 16:
            return value
        raise ValueError(f"Value must be a 26-char ULID string or 16-byte BINARY: {value}")

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return str(ULID.from_bytes(value))

def generate_ulid() -> str:
    # 新しいULID文字列を生成する
    return str(ULID())
