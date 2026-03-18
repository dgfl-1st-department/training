from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets

from app.core.dependencies import get_db, get_current_user
from app.core.config import settings
from app.core.auth_client import oauth
from app.models.user import User
from app.models.session import Session as UserSession
from app.schemas.user import User as UserSchema
from app.core.audit import log_audit

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.get("/login")
async def login(request: Request):
    redirect_uri = settings.GOOGLE_CALLBACK_URL
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/callback")
async def callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        log_audit(db, "login_fail", details={"reason": "oauth_failed", "error": str(e), "ip": request.client.host})
        raise HTTPException(status_code=400, detail=f"OAuth failed: {str(e)}")
    
    user_info = token.get('userinfo')
    if not user_info:
        log_audit(db, "login_fail", details={"reason": "no_user_info", "ip": request.client.host})
        raise HTTPException(status_code=400, detail="Failed to get user info from Google")
    
    email = user_info.get('email')
    if not email:
        log_audit(db, "login_fail", details={"reason": "no_email", "ip": request.client.host})
        raise HTTPException(status_code=400, detail="Email not provided by Google")
    
    # Domain verification
    domain = email.split('@')[-1]
    if settings.ALLOWED_DOMAIN and domain != settings.ALLOWED_DOMAIN:
        log_audit(db, "login_fail", details={"email": email, "reason": "unauthorized_domain", "ip": request.client.host})
        raise HTTPException(status_code=403, detail="Unauthorized domain")
    
    # Get or Create User
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            name=user_info.get('name'),
            role='employee' # Default role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Create MySQL Session
    session_id = secrets.token_urlsafe(32)
    expires_at = datetime.now() + timedelta(seconds=settings.SESSION_EXPIRE_SECONDS)
    
    new_session = UserSession(
        id=session_id,
        user_id=user.id,
        expires_at=expires_at
    )
    db.add(new_session)
    db.commit()
    
    log_audit(db, "login_success", user_id=user.id, details={"ip": request.client.host, "user_agent": request.headers.get("user-agent")})
    
    # Set Cookie and Redirect (Placeholder for Frontend URL)
    response = Response(status_code=status.HTTP_302_FOUND)
    response.headers["Location"] = "/" # Redirect to frontend top
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.SESSION_EXPIRE_SECONDS
    )
    return response

@router.get("/me", response_model=UserSchema)
async def get_me(request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return user

@router.post("/logout")
async def logout(response: Response, request: Request, db: Session = Depends(get_db)):
    session_id = request.cookies.get("session_id")
    if session_id:
        db.query(UserSession).filter(UserSession.id == session_id).delete()
        db.commit()
    response.delete_cookie("session_id")
    return {"status": "ok"}
