import base64
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

class Security:
    def __init__(self):
        # 32 bytes key for AES-256
        key_bytes = base64.b64decode(settings.ENCRYPTION_KEY)
        if len(key_bytes) != 32:
            raise ValueError("ENCRYPTION_KEY must be a base64 encoded 32-byte key")
        self.aesgcm = AESGCM(key_bytes)

    def encrypt(self, data: str) -> str:
        if not data:
            return ""
        nonce = os.urandom(12)
        ciphertext = self.aesgcm.encrypt(nonce, data.encode(), None)
        # Store as base64(nonce + ciphertext)
        return base64.b64encode(nonce + ciphertext).decode()

    def decrypt(self, encrypted_data: str) -> str:
        if not encrypted_data:
            return ""
        try:
            combined = base64.b64decode(encrypted_data)
            nonce = combined[:12]
            ciphertext = combined[12:]
            decrypted = self.aesgcm.decrypt(nonce, ciphertext, None)
            return decrypted.decode()
        except Exception:
            # Fallback or error logging
            return "[Decryption Error]"

security = Security()
