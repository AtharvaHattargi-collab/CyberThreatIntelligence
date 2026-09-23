from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel, EmailStr

from database import get_db
from models import User
from auth_utils import get_current_admin_user, get_password_hash

router = APIRouter(prefix="/api/users", tags=["users"])

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "VIEWER"

class UserOut(BaseModel):
    id: int
    email: str
    username: str
    role: str
    is_active: bool
    created_at: str
    last_login: str = None
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[UserOut])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    users = db.query(User).all()
    # Serialize properly
    out = []
    for u in users:
        out.append({
            "id": u.id,
            "email": u.email,
            "username": u.username,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": str(u.created_at) if u.created_at else "",
            "last_login": str(u.last_login) if u.last_login else "",
        })
    return out

@router.post("/", response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    db_user = db.query(User).filter((User.email == user.email) | (User.username == user.username)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
        
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        password_hash=hashed_password,
        role=user.role.upper()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return {
        "id": db_user.id,
        "email": db_user.email,
        "username": db_user.username,
        "role": db_user.role,
        "is_active": db_user.is_active,
        "created_at": str(db_user.created_at) if db_user.created_at else "",
        "last_login": str(db_user.last_login) if db_user.last_login else "",
    }

class UserUpdateRole(BaseModel):
    role: str
    
@router.put("/{user_id}/role")
def update_user_role(user_id: int, req: UserUpdateRole, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.role = req.role.upper()
    db.commit()
    return {"message": "Role updated"}

@router.put("/{user_id}/toggle-active")
def toggle_user_active(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = not user.is_active
    db.commit()
    return {"message": "User status toggled", "is_active": user.is_active}
