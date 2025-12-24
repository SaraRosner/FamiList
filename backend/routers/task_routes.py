from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import Task, TaskHistory, User
from schemas import TaskCreate, TaskResponse, TaskListResponse, TaskUpdateResponse
from auth import get_current_user_with_family
from models import User as UserModel
from email_service import send_email, build_task_created_email_he

router = APIRouter(prefix="/tasks", tags=["Tasks"])

def task_to_response(task: Task, db: Session) -> dict:
    """Convert Task model to response dict with creator and volunteer names"""
    creator = db.query(User).filter(User.id == task.created_by).first()
    volunteer = db.query(User).filter(User.id == task.volunteer_id).first() if task.volunteer_id else None
    
    return {
        **task.__dict__,
        "creator_name": creator.name if creator else "Unknown",
        "volunteer_name": volunteer.name if volunteer else None
    }

@router.post("/", response_model=TaskUpdateResponse, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=TaskUpdateResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = None
):
    """Create a new task"""
    # Parse due date if provided
    due_date = None
    if task_data.dueDate:
        try:
            due_date = datetime.fromisoformat(task_data.dueDate.replace('Z', '+00:00'))
        except:
            pass
    
    # Create task
    task = Task(
        family_id=current_user.family_id,
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority,
        created_by=current_user.id,
        due_date=due_date
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    
    # Add history
    history = TaskHistory(task_id=task.id, user_id=current_user.id, action="created")
    db.add(history)
    db.commit()

    # Send background email notification to all family members
    try:
        members = db.query(UserModel).filter(UserModel.family_id == current_user.family_id).all()
        recipient_emails = [m.email for m in members if m.email]
        subject, body = build_task_created_email_he(task.title, current_user.name, None)
        if background_tasks is not None:
            background_tasks.add_task(send_email, subject, body, recipient_emails)
        else:
            send_email(subject, body, recipient_emails)
    except Exception as e:
        # Log but don't fail the request
        print("Email notification error:", e)

    return {"task": TaskResponse(**task_to_response(task, db))}


@router.patch("/{task_id}", response_model=TaskUpdateResponse)
def update_task(
    task_id: int,
    task_data: TaskCreate,  # reuse fields: title, description, priority, dueDate
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db)
):
    """Update task fields (title, description, priority, due_date)."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.family_id != current_user.family_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Update fields if provided
    if task_data.title:
        task.title = task_data.title
    task.description = task_data.description
    if task_data.priority:
        task.priority = task_data.priority
    if task_data.dueDate:
        try:
            task.due_date = datetime.fromisoformat(task_data.dueDate.replace('Z', '+00:00'))
        except:
            task.due_date = None
    else:
        task.due_date = None if task_data.dueDate is None else task.due_date

    db.commit()
    db.refresh(task)
    return {"task": TaskResponse(**task_to_response(task, db))}


@router.post("/{task_id}/reassign", response_model=TaskUpdateResponse)
def reassign_task(
    task_id: int,
    payload: dict,
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db)
):
    """Change task volunteer: set to a family member or clear back to unclaimed."""
    volunteer_id = payload.get("volunteerId")

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.family_id != current_user.family_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if volunteer_id is None:
        task.volunteer_id = None
        task.status = "unclaimed"
        task.volunteered_at = None
    else:
        # Validate volunteer is same family
        member = db.query(UserModel).filter(UserModel.id == volunteer_id, UserModel.family_id == current_user.family_id).first()
        if not member:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid volunteer")
        task.volunteer_id = volunteer_id
        task.status = "in_progress"
        task.volunteered_at = datetime.utcnow()

    db.commit()
    db.refresh(task)
    return {"task": TaskResponse(**task_to_response(task, db))}

@router.get("/", response_model=TaskListResponse)
@router.get("", response_model=TaskListResponse)
def get_tasks(
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db)
):
    """Get all tasks for the user's family"""
    tasks = db.query(Task).filter(Task.family_id == current_user.family_id).all()
    
    # Sort by status priority and creation date
    status_order = {"unclaimed": 1, "in_progress": 2, "completed": 3}
    tasks_sorted = sorted(tasks, key=lambda t: (status_order.get(t.status, 4), -t.id))
    
    return {
        "tasks": [TaskResponse(**task_to_response(task, db)) for task in tasks_sorted]
    }

@router.post("/{task_id}/volunteer", response_model=TaskUpdateResponse)
def volunteer_for_task(
    task_id: int,
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db)
):
    """Volunteer for a task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    if task.family_id != current_user.family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if task.status != "unclaimed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task is not available"
        )
    
    # Update task
    task.volunteer_id = current_user.id
    task.status = "in_progress"
    task.volunteered_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    
    # Add history
    history = TaskHistory(task_id=task.id, user_id=current_user.id, action="volunteered")
    db.add(history)
    db.commit()
    
    return {"task": TaskResponse(**task_to_response(task, db))}

@router.post("/{task_id}/unvolunteer", response_model=TaskUpdateResponse)
def unvolunteer_from_task(
    task_id: int,
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db)
):
    """Unvolunteer from a task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    if task.family_id != current_user.family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if task.volunteer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your task"
        )
    
    # Update task
    task.volunteer_id = None
    task.status = "unclaimed"
    task.volunteered_at = None
    db.commit()
    db.refresh(task)
    
    # Add history
    history = TaskHistory(task_id=task.id, user_id=current_user.id, action="unvolunteered")
    db.add(history)
    db.commit()
    
    return {"task": TaskResponse(**task_to_response(task, db))}

@router.post("/{task_id}/complete", response_model=TaskUpdateResponse)
def complete_task(
    task_id: int,
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db)
):
    """Complete a task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    if task.family_id != current_user.family_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if task.volunteer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your task"
        )
    
    # Update task
    task.status = "completed"
    task.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    
    # Add history
    history = TaskHistory(task_id=task.id, user_id=current_user.id, action="completed")
    db.add(history)
    db.commit()
    
    return {"task": TaskResponse(**task_to_response(task, db))}

