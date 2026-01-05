from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
try:
    from zoneinfo import ZoneInfo
except ImportError:
    # Fallback for Python < 3.9
    from backports.zoneinfo import ZoneInfo
from database import SessionLocal
from models import Reminder, Task, User, Family
from email_service import send_email, build_unclaimed_reminder_email_he, build_task_due_tomorrow_email_he

# Set timezone for scheduler (Israel time)
ISRAEL_TZ = ZoneInfo('Asia/Jerusalem')

# Configure scheduler with better defaults for missed jobs
scheduler = BackgroundScheduler(
    timezone=ISRAEL_TZ,  # Use Israel timezone for all scheduled jobs
    job_defaults={
        'misfire_grace_time': 1800,  # 30 minutes - allow jobs to run if server was down
        'coalesce': True,  # If multiple runs missed, only run once
        'max_instances': 1  # Only one instance of each job at a time
    }
)

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

def send_unclaimed_reminders(for_date: datetime = None):
    """Send daily reminder at 22:00 about unclaimed tasks to all family members
    
    Args:
        for_date: The date for which to send reminders (defaults to yesterday's date)
    """
    if for_date is None:
        for_date = datetime.now(ISRAEL_TZ) - timedelta(days=1)
    for_date_str = for_date.strftime('%Y-%m-%d')
    
    print(f"[REMINDER] Running send_unclaimed_reminders for date {for_date_str} at {datetime.now()}")
    db: Session = SessionLocal()
    try:
        # Check if we already sent reminders for this date
        reminder_type = f"daily_unclaimed_{for_date_str}"
        existing = db.query(Reminder).filter(
            Reminder.type == reminder_type,
            Reminder.sent == True
        ).first()
        
        if existing:
            print(f"[REMINDER] Unclaimed reminders for {for_date_str} already sent, skipping")
            return
        
        # Get all families
        families = db.query(Family).all()
        sent_count = 0
        
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
                    success = send_email(subject, body, emails)
                    if success:
                        sent_count += len(emails)
                        # Use ASCII-safe print to avoid encoding issues on Windows
                        print(f"[REMINDER] Sent unclaimed reminder to {len(emails)} members (family_id={family.id}) with {unclaimed_count} tasks")
                    else:
                        print(f"[REMINDER] FAILED to send unclaimed reminder to {len(emails)} members (family_id={family.id}) - email service error")
        
        # Mark that we sent reminders for this date only if emails were actually sent
        # Use first family ID for tracking (the type field makes it unique anyway)
        first_family = db.query(Family).first()
        if sent_count > 0 and first_family:
            reminder = Reminder(
                family_id=first_family.id,  # Use first family for tracking (type makes it unique)
                type=reminder_type,
                message=f"Daily unclaimed reminders sent for {for_date_str}",
                scheduled_for=for_date.replace(hour=22, minute=0, second=0),
                sent=True,
                sent_at=datetime.now(ISRAEL_TZ)
            )
            db.add(reminder)
            db.commit()
            print(f"[REMINDER] Marked reminders as sent for {for_date_str}")
        elif sent_count == 0:
            print(f"[REMINDER] No reminders were sent successfully for {for_date_str} - will retry on next check")
        
    except Exception as e:
        print(f"[REMINDER] Error sending unclaimed reminders: {str(e)}")
        db.rollback()
        import traceback
        try:
            traceback.print_exc()
        except UnicodeEncodeError:
            print("[REMINDER] Error details (encoding issue - check logs)")
    finally:
        db.close()


def send_due_tomorrow_reminders(for_date: datetime = None):
    """Send daily reminder at 22:00 to volunteers about tasks due tomorrow
    
    Args:
        for_date: The date for which to send reminders (defaults to yesterday's date)
    """
    if for_date is None:
        for_date = datetime.now(ISRAEL_TZ) - timedelta(days=1)
    for_date_str = for_date.strftime('%Y-%m-%d')
    
    print(f"[REMINDER] Running send_due_tomorrow_reminders for date {for_date_str} at {datetime.now()}")
    db: Session = SessionLocal()
    try:
        # Check if we already sent reminders for this date
        reminder_type = f"daily_due_tomorrow_{for_date_str}"
        existing = db.query(Reminder).filter(
            Reminder.type == reminder_type,
            Reminder.sent == True
        ).first()
        
        if existing:
            print(f"[REMINDER] Due tomorrow reminders for {for_date_str} already sent, skipping")
            return
        
        # Calculate tomorrow's date (relative to for_date)
        tomorrow = (for_date + timedelta(days=1)).date()
        
        # Find tasks due tomorrow that are in progress
        tasks = db.query(Task).filter(
            Task.status == "in_progress",
            Task.volunteer_id != None,
            Task.due_date != None
        ).all()
        
        sent_count = 0
        for task in tasks:
            # Check if due date matches tomorrow (compare dates only)
            if task.due_date and task.due_date.date() == tomorrow:
                volunteer = db.query(User).filter(User.id == task.volunteer_id).first()
                if volunteer and volunteer.email:
                    due_date_str = task.due_date.strftime("%d/%m/%Y")
                    subject, body = build_task_due_tomorrow_email_he(task.title, due_date_str)
                    success = send_email(subject, body, [volunteer.email])
                    if success:
                        sent_count += 1
                        print(f"[REMINDER] Sent due tomorrow reminder for task_id={task.id} to {volunteer.email}")
                    else:
                        print(f"[REMINDER] FAILED to send due tomorrow reminder for task_id={task.id} to {volunteer.email} - email service error")
        
        # Mark that we sent reminders for this date only if emails were actually sent
        # Use first family ID for tracking (the type field makes it unique anyway)
        first_family = db.query(Family).first()
        if sent_count > 0 and first_family:
            reminder = Reminder(
                family_id=first_family.id,  # Use first family for tracking (type makes it unique)
                type=reminder_type,
                message=f"Daily due tomorrow reminders sent for {for_date_str}",
                scheduled_for=for_date.replace(hour=22, minute=0, second=0),
                sent=True,
                sent_at=datetime.now(ISRAEL_TZ)
            )
            db.add(reminder)
            db.commit()
            print(f"[REMINDER] Marked due tomorrow reminders as sent for {for_date_str}")
        elif sent_count == 0 and len(tasks) > 0:
            print(f"[REMINDER] No due tomorrow reminders were sent successfully for {for_date_str} - will retry on next check")
        
    except Exception as e:
        print(f"[REMINDER] Error sending due tomorrow reminders: {str(e)}")
        db.rollback()
        import traceback
        try:
            traceback.print_exc()
        except UnicodeEncodeError:
            print("[REMINDER] Error details (encoding issue - check logs)")
    finally:
        db.close()


def check_and_send_missed_daily_reminders():
    """Check if we missed sending daily reminders and send them if it's within grace period.
    This is called when server starts - check if we're within 12 hours of the last 22:00."""
    now = datetime.now(ISRAEL_TZ)
    current_time_str = now.strftime('%Y-%m-%d %H:%M:%S %Z')
    
    print(f"[REMINDER] check_and_send_missed_daily_reminders called at {current_time_str}")
    
    # Calculate the last 22:00 (either today's if before 22:00, or yesterday's if after 22:00)
    today_22 = now.replace(hour=22, minute=0, second=0, microsecond=0)
    if now >= today_22:
        # It's after 22:00 today, so check if we missed today's 22:00
        last_22 = today_22
    else:
        # It's before 22:00 today, so check yesterday's 22:00
        last_22 = today_22 - timedelta(days=1)
    
    # Calculate time difference
    time_diff = (now - last_22).total_seconds()
    time_diff_hours = time_diff / 3600
    
    print(f"[REMINDER] Calculated last 22:00: {last_22.strftime('%Y-%m-%d %H:%M:%S %Z')}")
    print(f"[REMINDER] Current time: {now.strftime('%Y-%m-%d %H:%M:%S %Z')}")
    print(f"[REMINDER] Time difference: {time_diff_hours:.2f} hours ({time_diff:.0f} seconds)")
    
    # Grace period: at least 10 minutes (to avoid duplicate if server restarted right at 22:00)
    # and up to 12 hours (reasonable grace period - until 10:00 next day)
    if 600 <= time_diff <= 43200:  # 10 minutes to 12 hours
        print(f"[REMINDER] Time difference is within grace period ({time_diff_hours:.2f}h) - sending missed reminders")
        print(f"[REMINDER] Sending reminders for date: {last_22.date()}")
        
        try:
            print("[REMINDER] Sending missed unclaimed reminders...")
            # Pass the date (yesterday's date) to the function
            send_unclaimed_reminders(last_22)
            print("[REMINDER] Sending missed due tomorrow reminders...")
            send_due_tomorrow_reminders(last_22)
            print("[REMINDER] Completed sending missed reminders")
        except Exception as e:
            print(f"[REMINDER] Error sending missed reminders: {e}")
            import traceback
            traceback.print_exc()
    else:
        print(f"[REMINDER] Skipping missed reminders - time difference ({time_diff_hours:.2f}h) is outside grace period (0.17-12h)")
        if time_diff < 600:
            print(f"[REMINDER] Too soon after 22:00 - might be duplicate")
        elif time_diff > 43200:
            print(f"[REMINDER] Too late - more than 12 hours have passed since {last_22.strftime('%Y-%m-%d %H:%M:%S %Z')}")

def start_reminder_service():
    """Start the reminder service"""
    # First, check if we missed any reminders from yesterday
    check_and_send_missed_daily_reminders()
    
    # Check for pending reminders every minute
    # misfire_grace_time: Allow job to run up to 5 minutes after scheduled time if missed
    # coalesce: If multiple runs were missed, only run the latest one
    scheduler.add_job(
        process_reminders, 
        'interval', 
        minutes=1,
        misfire_grace_time=300,  # 5 minutes
        coalesce=True,
        max_instances=1
    )
    
    # Daily reminders at 22:00 (10 PM)
    # misfire_grace_time: Allow job to run up to 30 minutes after scheduled time if missed
    # coalesce: If missed, run once when server comes back
    scheduler.add_job(
        send_unclaimed_reminders, 
        'cron', 
        hour=22, 
        minute=0,
        timezone=ISRAEL_TZ,
        misfire_grace_time=1800,  # 30 minutes - allows running if server was down
        coalesce=True,
        max_instances=1
    )
    scheduler.add_job(
        send_due_tomorrow_reminders, 
        'cron', 
        hour=22, 
        minute=0,
        timezone=ISRAEL_TZ,
        misfire_grace_time=1800,  # 30 minutes - allows running if server was down
        coalesce=True,
        max_instances=1
    )
    
    # Weekly reports every Sunday at 18:00
    # scheduler.add_job(generate_weekly_reports, 'cron', day_of_week='sun', hour=18)
    
    scheduler.start()
    print("Reminder service started")
    print("Daily reminders scheduled: 22:00 (unclaimed tasks + due tomorrow)")
    print("Note: Jobs will run even if server was down (up to 30 minutes after scheduled time)")
    print("Note: On server start, will check and send missed reminders from previous day if within 8 hours")

def stop_reminder_service():
    """Stop the reminder service"""
    scheduler.shutdown()
    print("Reminder service stopped")

