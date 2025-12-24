from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import SessionLocal
from models import Reminder, Task, User, Family
from email_service import send_email, build_unclaimed_reminder_email_he, build_task_due_tomorrow_email_he

scheduler = BackgroundScheduler()

def process_reminders():
    """Process pending reminders"""
    db: Session = SessionLocal()
    try:
        # Get pending reminders
        pending_reminders = db.query(Reminder).filter(
            Reminder.sent == False,
            Reminder.scheduled_for <= datetime.utcnow()
        ).all()
        
        for reminder in pending_reminders:
            # In a real application, this would send emails/SMS
            # For now, we just log and mark as sent
            print(f"[REMINDER] Type: {reminder.type}, Message: {reminder.message}")
            
            # Mark as sent
            reminder.sent = True
            reminder.sent_at = datetime.utcnow()
        
        db.commit()
        
        if pending_reminders:
            print(f"Processed {len(pending_reminders)} reminders")
            
    except Exception as e:
        print(f"Error processing reminders: {e}")
        db.rollback()
    finally:
        db.close()

def send_unclaimed_reminders():
    """Send daily reminder at 22:00 about unclaimed tasks to all family members"""
    db: Session = SessionLocal()
    try:
        # Get all families
        families = db.query(Family).all()
        
        for family in families:
            # Get unclaimed tasks with titles
            unclaimed_tasks = db.query(Task).filter(
                Task.family_id == family.id,
                Task.status == "unclaimed"
            ).all()
            
            if unclaimed_tasks:
                unclaimed_count = len(unclaimed_tasks)
                task_titles = [task.title for task in unclaimed_tasks]
                
                # Get all family members
                members = db.query(User).filter(User.family_id == family.id).all()
                emails = [m.email for m in members if m.email]
                
                if emails:
                    subject, body = build_unclaimed_reminder_email_he(unclaimed_count, family.name, task_titles)
                    send_email(subject, body, emails)
                    print(f"[REMINDER] Sent unclaimed reminder to {len(emails)} members of {family.name} with {unclaimed_count} tasks")
        
    except Exception as e:
        print(f"Error sending unclaimed reminders: {e}")
    finally:
        db.close()


def send_due_tomorrow_reminders():
    """Send daily reminder at 22:00 to volunteers about tasks due tomorrow"""
    db: Session = SessionLocal()
    try:
        # Calculate tomorrow's date
        tomorrow = (datetime.utcnow() + timedelta(days=1)).date()
        
        # Find tasks due tomorrow that are in progress
        tasks = db.query(Task).filter(
            Task.status == "in_progress",
            Task.volunteer_id != None,
            Task.due_date != None
        ).all()
        
        for task in tasks:
            # Check if due date matches tomorrow (compare dates only)
            if task.due_date and task.due_date.date() == tomorrow:
                volunteer = db.query(User).filter(User.id == task.volunteer_id).first()
                if volunteer and volunteer.email:
                    due_date_str = task.due_date.strftime("%d/%m/%Y")
                    subject, body = build_task_due_tomorrow_email_he(task.title, due_date_str)
                    send_email(subject, body, [volunteer.email])
                    print(f"[REMINDER] Sent due tomorrow reminder for task {task.id} to {volunteer.email}")
        
    except Exception as e:
        print(f"Error sending due tomorrow reminders: {e}")
    finally:
        db.close()


def start_reminder_service():
    """Start the reminder service"""
    # Check for pending reminders every minute
    scheduler.add_job(process_reminders, 'interval', minutes=1)
    
    # Daily reminders at 22:00 (10 PM)
    scheduler.add_job(send_unclaimed_reminders, 'cron', hour=22, minute=0)
    scheduler.add_job(send_due_tomorrow_reminders, 'cron', hour=22, minute=0)
    
    # Weekly reports every Sunday at 18:00
    # scheduler.add_job(generate_weekly_reports, 'cron', day_of_week='sun', hour=18)
    
    scheduler.start()
    print("Reminder service started")
    print("Daily reminders scheduled: 22:00 (unclaimed tasks + due tomorrow)")

def stop_reminder_service():
    """Stop the reminder service"""
    scheduler.shutdown()
    print("Reminder service stopped")

