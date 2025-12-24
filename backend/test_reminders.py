"""Quick test script to manually trigger reminders"""
from reminder_service import send_unclaimed_reminders, send_due_tomorrow_reminders

print("Testing reminder service...")
print("\n1. Sending unclaimed reminders:")
send_unclaimed_reminders()

print("\n2. Sending due tomorrow reminders:")
send_due_tomorrow_reminders()

print("\nDone! Check console for EMAIL-LOG output (if no SMTP configured)")

