from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User
from schemas import UserResponse, MemberCreate, MemberRoleUpdate
from auth import get_current_user_with_family


router = APIRouter(prefix="/members", tags=["Family Members"])


def _ensure_admin(current_user: User):
    """Ensure the current user is an admin in their family"""
    if current_user.role not in ("ADMIN", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can perform this action",
        )


@router.get("/", response_model=List[UserResponse])
@router.get("", response_model=List[UserResponse])
def list_family_members(
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db),
):
    """List all members in the current user's family"""
    members = (
        db.query(User)
        .filter(User.family_id == current_user.family_id)
        .order_by(User.created_at.asc())
        .all()
    )
    return [UserResponse.from_orm(m) for m in members]


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def add_family_member(
    payload: MemberCreate,
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db),
):
    """Add a new member to the family (admin only)"""
    _ensure_admin(current_user)

    # Import here to avoid circular import issues
    from auth import hash_password

    # Check if email already exists
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # For now use a simple default password; in a real system we'd send an invite link
    default_password = hash_password("familist123")

    new_user = User(
        email=payload.email,
        password=default_password,
        name=payload.name,
        family_id=current_user.family_id,
        role=payload.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserResponse.from_orm(new_user)


@router.patch("/{member_id}/role", response_model=UserResponse)
def update_member_role(
    member_id: int,
    payload: MemberRoleUpdate,
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db),
):
    """Update a member's role (admin only)"""
    _ensure_admin(current_user)

    member = (
        db.query(User)
        .filter(
            User.id == member_id,
            User.family_id == current_user.family_id,
        )
        .first()
    )

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    # Prevent an admin from demoting themselves in a way that would leave the family with no admin
    member.role = payload.role
    db.commit()
    db.refresh(member)

    return UserResponse.from_orm(member)

