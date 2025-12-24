from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from models import FamilyEvent, User
from schemas import FamilyEventCreate, FamilyEventResponse, FamilyEventListResponse
from auth import get_current_user_with_family

router = APIRouter(prefix="/family-events", tags=["Family Events"])


@router.get("", response_model=FamilyEventListResponse)
def list_family_events(
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db)
):
    """Get all family events, ordered by start_date (upcoming first)"""
    events = db.query(FamilyEvent).filter(
        FamilyEvent.family_id == current_user.family_id
    ).order_by(FamilyEvent.start_date).all()
    
    event_responses = []
    for event in events:
        creator = db.query(User).filter(User.id == event.created_by).first()
        event_responses.append(FamilyEventResponse(
            id=event.id,
            family_id=event.family_id,
            created_by=event.created_by,
            created_by_name=creator.name if creator else "Unknown",
            title=event.title,
            description=event.description,
            start_date=event.start_date,
            end_date=event.end_date,
            created_at=event.created_at
        ))
    
    return FamilyEventListResponse(events=event_responses)


@router.post("", response_model=FamilyEventResponse, status_code=status.HTTP_201_CREATED)
def create_family_event(
    event_data: FamilyEventCreate,
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db)
):
    """Create a new family event"""
    # Validate end_date is after start_date if provided
    if event_data.end_date and event_data.end_date < event_data.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date"
        )
    
    event = FamilyEvent(
        family_id=current_user.family_id,
        created_by=current_user.id,
        title=event_data.title,
        description=event_data.description,
        start_date=event_data.start_date,
        end_date=event_data.end_date
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    
    return FamilyEventResponse(
        id=event.id,
        family_id=event.family_id,
        created_by=event.created_by,
        created_by_name=current_user.name,
        title=event.title,
        description=event.description,
        start_date=event.start_date,
        end_date=event.end_date,
        created_at=event.created_at
    )


@router.put("/{event_id}", response_model=FamilyEventResponse)
def update_family_event(
    event_id: int,
    event_data: FamilyEventCreate,
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db)
):
    """Update a family event"""
    event = db.query(FamilyEvent).filter(
        FamilyEvent.id == event_id,
        FamilyEvent.family_id == current_user.family_id
    ).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Validate end_date is after start_date if provided
    if event_data.end_date and event_data.end_date < event_data.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date"
        )
    
    event.title = event_data.title
    event.description = event_data.description
    event.start_date = event_data.start_date
    event.end_date = event_data.end_date
    
    db.commit()
    db.refresh(event)
    
    creator = db.query(User).filter(User.id == event.created_by).first()
    return FamilyEventResponse(
        id=event.id,
        family_id=event.family_id,
        created_by=event.created_by,
        created_by_name=creator.name if creator else "Unknown",
        title=event.title,
        description=event.description,
        start_date=event.start_date,
        end_date=event.end_date,
        created_at=event.created_at
    )


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_family_event(
    event_id: int,
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db)
):
    """Delete a family event"""
    event = db.query(FamilyEvent).filter(
        FamilyEvent.id == event_id,
        FamilyEvent.family_id == current_user.family_id
    ).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    db.delete(event)
    db.commit()
    return None

