import smtplib
from email.mime.text import MIMEText
from email.utils import formataddr
from typing import List
from config import settings
import json
import requests


def is_smtp_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_PORT and settings.SMTP_FROM_EMAIL)


def is_sendgrid_configured() -> bool:
    return bool(settings.SENDGRID_API_KEY and settings.SMTP_FROM_EMAIL)


def send_email(subject: str, body: str, recipients: List[str]) -> None:
    if not recipients:
        return

    # Prefer SendGrid if configured
    if is_sendgrid_configured():
        try:
            data = {
                "personalizations": [{"to": [{"email": r} for r in recipients]}],
                "from": {"email": settings.SMTP_FROM_EMAIL, "name": settings.SMTP_FROM_NAME},
                "subject": subject,
                "content": [{"type": "text/plain", "value": body}],
            }
            resp = requests.post(
                "https://api.sendgrid.com/v3/mail/send",
                headers={
                    "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
                    "Content-Type": "application/json",
                },
                data=json.dumps(data),
                timeout=10,
            )
            if resp.status_code >= 300:
                print("[EMAIL] SendGrid error:", resp.status_code, resp.text)
        except Exception as e:
            print("[EMAIL] SendGrid exception:", e)
        return

    if not is_smtp_configured():
        # Fallback: log to console for development
        print("[EMAIL-LOG] Subject:", subject)
        print("[EMAIL-LOG] To:", ", ".join(recipients))
        print("[EMAIL-LOG] Body:\n", body)
        return

    msg = MIMEText(body, _charset="utf-8")
    msg["Subject"] = subject
    msg["From"] = formataddr((settings.SMTP_FROM_NAME, settings.SMTP_FROM_EMAIL))
    msg["To"] = ", ".join(recipients)

    if settings.SMTP_USER and settings.SMTP_PASS:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASS)
    else:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)

    try:
        server.sendmail(settings.SMTP_FROM_EMAIL, recipients, msg.as_string())
    finally:
        server.quit()


def build_task_created_email_he(task_title: str, creator_name: str, volunteer_name: str | None) -> tuple[str, str]:
    subject = f"משימה חדשה נוספה: {task_title}"
    volunteer_text = f"\nמתנדב/ת: {volunteer_name}" if volunteer_name else "\nטרם נבחר מתנדב"
    body = (
        "שלום משפחה יקרה,\n\n"
        f"נוספה משימה חדשה בלוח: {task_title}\n"
        f"נוצר על ידי: {creator_name}{volunteer_text}\n\n"
        "אפשר להיכנס ל-FamiList ולהתנדב בלחיצה נעימה.\n\n"
        "באהבה,\nFamiList"
    )
    return subject, body


def build_unclaimed_reminder_email_he(unclaimed_count: int, family_name: str, task_titles: list[str]) -> tuple[str, str]:
    subject = f"תזכורת: {unclaimed_count} משימות ממתינות להתנדבות"
    
    tasks_list = "\n".join([f"• {title}" for title in task_titles])
    
    body = (
        f"שלום משפחת {family_name},\n\n"
        f"יש לכם {unclaimed_count} משימות שממתינות להתנדבות:\n\n"
        f"{tasks_list}\n\n"
        "אם יש מישהו שיכול לעזור, זה יהיה נהדר!\n\n"
        "ניתן להיכנס ל-FamiList ולהתנדב למשימות השונות.\n\n"
        "תודה רבה על השיתוף והעזרה! 💚\n\n"
        "באהבה,\nFamiList"
    )
    return subject, body


def build_task_due_tomorrow_email_he(task_title: str, due_date: str) -> tuple[str, str]:
    subject = f"תזכורת: משימה ממתינה - {task_title}"
    body = (
        "שלום,\n\n"
        f"זו תזכורת נעימה: יש לך משימה שצריך לבצע מחר: {task_title}\n"
        f"תאריך יעד: {due_date}\n\n"
        "אם כבר ביצעת אותה, אפשר לסמן אותה כהושלמה בלוח.\n"
        "אם יש צורך לדחות או לשנות משהו, אפשר לערוך את המשימה.\n\n"
        "תודה על הטיפול! 💙\n\n"
        "באהבה,\nFamiList"
    )
    return subject, body


