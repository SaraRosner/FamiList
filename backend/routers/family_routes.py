from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Family, User
from schemas import (
    FamilyCreate, FamilyResponse, FamilyWithMembers, 
    FamilyWithToken, UserResponse
)
from auth import get_current_user, create_access_token

router = APIRouter(prefix="/family", tags=["Family"])

@router.post("/create", response_model=FamilyWithToken, status_code=status.HTTP_201_CREATED)
def create_family(
    family_data: FamilyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new family"""
    # Check if user already has a family
    if current_user.family_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already belongs to a family"
        )
    
    # Create family
    family = Family(name=family_data.name)
    db.add(family)
    db.commit()
    db.refresh(family)
    
    # Update user's family_id and make them ADMIN of this family
    current_user.family_id = family.id
    current_user.role = "ADMIN"
    db.commit()
    db.refresh(current_user)
    
    # Create new token with family_id
    token = create_access_token({"userId": current_user.id, "familyId": current_user.family_id})
    
    return {
        "family": FamilyResponse.from_orm(family),
        "user": UserResponse.from_orm(current_user),
        "token": token
    }

@router.post("/join/{family_id}", response_model=FamilyWithToken)
def join_family(
    family_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join an existing family"""
    # Check if user already has a family
    if current_user.family_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already belongs to a family"
        )
    
    # Check if family exists
    family = db.query(Family).filter(Family.id == family_id).first()
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found"
        )
    
    # Update user's family_id
    current_user.family_id = family_id
    db.commit()
    db.refresh(current_user)
    
    # Create new token with family_id
    token = create_access_token({"userId": current_user.id, "familyId": current_user.family_id})
    
    return {
        "family": FamilyResponse.from_orm(family),
        "user": UserResponse.from_orm(current_user),
        "token": token
    }

@router.get("/", response_model=FamilyWithMembers)
@router.get("", response_model=FamilyWithMembers)
def get_family(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get family information"""
    if not current_user.family_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not belong to a family"
        )
    
    family = db.query(Family).filter(Family.id == current_user.family_id).first()
    if not family:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found"
        )
    
    members = db.query(User).filter(User.family_id == current_user.family_id).all()
    
    return {
        "family": FamilyResponse.from_orm(family),
        "members": [UserResponse.from_orm(member) for member in members]
    }

@router.get("/list")
def list_families(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all families"""
    families = db.query(Family).order_by(Family.created_at.desc()).all()
    return {
        "families": [FamilyResponse.from_orm(family) for family in families]
    }

