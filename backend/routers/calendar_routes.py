from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime
from typing import Optional
from database import get_db
from models import Task, FamilyEvent, User
from auth import get_current_user_with_family

router = APIRouter(prefix="/calendar", tags=["Calendar"])


@router.get("")
def get_calendar_items(
    start_date: str = Query(..., description="Start date in ISO format (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date in ISO format (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db)
):
    """Get tasks and family events within a date range for calendar view"""
    try:
        start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    except ValueError:
        return {
            "error": "Invalid date format. Use YYYY-MM-DD"
        }
    
    # Get tasks with due_date in range
    tasks = db.query(Task).filter(
        Task.family_id == current_user.family_id,
        Task.due_date.isnot(None),
        Task.due_date >= start,
        Task.due_date <= end
    ).all()
    
    # Get family events that overlap with the date range
    # (start_date <= end AND (end_date >= start OR end_date IS NULL))
    events = db.query(FamilyEvent).filter(
        FamilyEvent.family_id == current_user.family_id,
        FamilyEvent.start_date <= end,
        or_(
            FamilyEvent.end_date.is_(None),
            FamilyEvent.end_date >= start
        )
    ).all()
    
    # Format tasks
    task_list = []
    for task in tasks:
        creator = db.query(User).filter(User.id == task.created_by).first()
        volunteer = db.query(User).filter(User.id == task.volunteer_id).first() if task.volunteer_id else None
        task_list.append({
            "id": task.id,
            "type": "task",
            "title": task.title,
            "description": task.description,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "priority": task.priority,
            "status": task.status,
            "creator_name": creator.name if creator else "Unknown",
            "volunteer_name": volunteer.name if volunteer else None,
        })
    
    # Format events
    event_list = []
    for event in events:
        creator = db.query(User).filter(User.id == event.created_by).first()
        event_list.append({
            "id": event.id,
            "type": "event",
            "title": event.title,
            "description": event.description,
            "start_date": event.start_date.isoformat(),
            "end_date": event.end_date.isoformat() if event.end_date else None,
            "creator_name": creator.name if creator else "Unknown",
        })
    
    return {
        "tasks": task_list,
        "events": event_list
    }

