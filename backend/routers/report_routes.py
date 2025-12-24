from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from database import get_db
from models import Task, User
from schemas import FairnessReport, UserStats, UserResponse
from auth import get_current_user_with_family

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/fairness", response_model=FairnessReport)
def get_fairness_report(
    period: str = Query("month", regex="^(week|month|all)$"),
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db)
):
    """Get fairness report showing task completion statistics"""
    # Calculate start date based on period
    start_date = None
    if period == "week":
        start_date = datetime.utcnow() - timedelta(days=7)
    elif period == "month":
        start_date = datetime.utcnow() - timedelta(days=30)
    
    # Query for completed tasks by user
    query = db.query(
        User.id.label("user_id"),
        User.name.label("user_name"),
        func.count(Task.id).label("completed_count")
    ).outerjoin(
        Task,
        (Task.volunteer_id == User.id) & (Task.status == "completed")
    ).filter(
        User.family_id == current_user.family_id
    )
    
    if start_date:
        query = query.filter(Task.completed_at >= start_date)
    
    query = query.group_by(User.id, User.name).order_by(func.count(Task.id).desc())
    
    results = query.all()
    
    # Get all family members
    members = db.query(User).filter(User.family_id == current_user.family_id).all()
    
    return {
        "period": period,
        "stats": [
            UserStats(
                user_id=r.user_id,
                user_name=r.user_name,
                completed_count=r.completed_count
            )
            for r in results
        ],
        "members": [UserResponse.from_orm(member) for member in members]
    }


@router.get("/open")
def get_open_tasks(
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db)
):
    """Return unclaimed and in-progress tasks for the user's family"""
    unclaimed = db.query(Task).filter(
        Task.family_id == current_user.family_id,
        Task.status == "unclaimed"
    ).all()

    in_progress = db.query(Task).filter(
        Task.family_id == current_user.family_id,
        Task.status == "in_progress"
    ).all()

    def serialize(task: Task):
        creator = db.query(User).filter(User.id == task.created_by).first()
        volunteer = db.query(User).filter(User.id == task.volunteer_id).first() if task.volunteer_id else None
        return {
            "id": task.id,
            "title": task.title,
            "priority": task.priority,
            "creator_name": creator.name if creator else "",
            "volunteer_name": volunteer.name if volunteer else None,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "created_at": task.created_at.isoformat() if task.created_at else None,
        }

    return {
        "unclaimed": [serialize(t) for t in unclaimed],
        "in_progress": [serialize(t) for t in in_progress],
    }

