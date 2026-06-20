import time
import hashlib
from typing import Dict, Optional

# Simple JWT simulation (since PyJWT might not be installed, we can simulate JWT validation or write standard python implementation)
# This prevents importing external libs that could be missing in user's env.
SECRET_KEY = "enterprise_dataops_secret_key"

def hash_password(password: str) -> str:
    """Hash password using SHA-256 for local demo authentication verification."""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def create_access_token(user_id: str, role: str) -> str:
    """Creates a simulated JWT access token."""
    expire = time.time() + 3600  # 1 hour expiration
    payload = f"uid:{user_id}|role:{role}|exp:{expire}"
    # Simple hash-based signature to simulate standard secure signing
    signature = hashlib.sha256(f"{payload}{SECRET_KEY}".encode('utf-8')).hexdigest()[:16]
    return f"{payload}.{signature}"

def verify_token(token: str) -> Optional[Dict[str, str]]:
    """Verifies simulated JWT token and returns payload data."""
    try:
        parts = token.split('.')
        if len(parts) != 2:
            return None
        payload_str, signature = parts
        
        # Verify signature
        expected_sig = hashlib.sha256(f"{payload_str}{SECRET_KEY}".encode('utf-8')).hexdigest()[:16]
        if signature != expected_sig:
            return None
            
        # Parse payload
        payload_parts = payload_str.split('|')
        payload = {}
        for part in payload_parts:
            k, v = part.split(':', 1)
            payload[k] = v
            
        # Check expiration
        if time.time() > float(payload.get('exp', 0)):
            return None
            
        return {
            "user_id": payload.get("uid"),
            "role": payload.get("role")
        }
    except Exception:
        return None
