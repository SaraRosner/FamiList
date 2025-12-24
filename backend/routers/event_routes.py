from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from database import get_db
from models import Event, User
from schemas import EventCreate, EventResponse, EventListResponse
from auth import get_current_user_with_family

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("", response_model=EventResponse, status_code=201)
def create_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db)
):
    """Create a new caregiver event."""
    event = Event(
        family_id=current_user.family_id,
        recorded_by=current_user.id,
        subject=event_data.subject,
        occurred_at=event_data.occurred_at,
        severity=event_data.severity,
        category=event_data.category,
        description=event_data.description,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    return EventResponse(
        id=event.id,
        family_id=event.family_id,
        recorded_by=event.recorded_by,
        subject=event.subject,
        occurred_at=event.occurred_at,
        severity=event.severity,
        category=event.category,
        description=event.description,
        created_at=event.created_at,
        recorder_name=current_user.name
    )


@router.get("", response_model=EventListResponse)
def list_events(
    months: Optional[int] = Query(1, ge=1),
    subject: Optional[str] = None,
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db)
):
    """List events with optional time range and subject filtering."""
    query = db.query(Event).filter(Event.family_id == current_user.family_id)

    if months:
        cutoff = datetime.utcnow() - timedelta(days=30 * months)
        query = query.filter(Event.occurred_at >= cutoff)

    if subject:
        query = query.filter(Event.subject == subject)

    events = query.order_by(Event.occurred_at.desc()).all()

    response_events = []
    for event in events:
        recorder = db.query(User).filter(User.id == event.recorded_by).first()
        response_events.append(
            EventResponse(
                id=event.id,
                family_id=event.family_id,
                recorded_by=event.recorded_by,
                subject=event.subject,
                occurred_at=event.occurred_at,
                severity=event.severity,
                category=event.category,
                description=event.description,
                created_at=event.created_at,
                recorder_name=recorder.name if recorder else "Unknown"
            )
        )

    return EventListResponse(events=response_events)

