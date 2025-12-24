# FamiList - Quick Start Guide 🚀

## Installation

### Backend (Python):
```bash
cd backend
python -m venv venv
venv\Scripts\activate    # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

### Frontend (Node.js):
```bash
cd frontend
npm install
```

## Running the Application

### Open Two Terminal Windows:

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate    # Windows (or source venv/bin/activate on macOS/Linux)
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Access the Application

Open your browser and go to: **http://localhost:5173**

## First Time Setup

1. **Register** a new account
2. **Create a family** (or join an existing one)
3. **Start creating tasks** and volunteering!

## Sample Workflow

### As the First Family Member:
1. Register: `david@example.com` / password: `123456` / name: `דוד כהן`
2. Create Family: `משפחת כהן`
3. Create a task: "ביקור אצל הרופא"
4. Volunteer for it: Click "אני אקח את זה 💪"
5. Complete it: Click "✓ סיימתי"

### As a Second Family Member:
1. Register another account: `sarah@example.com` / password: `123456` / name: `שרה כהן`
2. Join the family: Select "משפחת כהן"
3. See available tasks and volunteer!
4. Check the reports page to see contribution statistics

## Key Features to Test

✅ **Task Board** - Three columns with smooth task flow
- משימות ללא בעלים (Unclaimed Tasks)
- המשימות שלי (My Tasks)  
- בוצעו (Completed)

✅ **Volunteering** - Family-friendly language ("Would you like to help?")

✅ **Reports** - View fairness statistics by week/month/all time

✅ **Hebrew RTL** - Complete right-to-left interface

## Troubleshooting

**Port already in use?**
- Backend (3000): Kill the process or change PORT in `backend/.env`
- Frontend (5173): Vite will automatically suggest another port

**Database errors?**
- Delete `backend/familist.db` and restart the backend to recreate

**Python errors?**
- Make sure you have Python 3.9+ installed
- Check that virtual environment is activated
- Try `pip install -r requirements.txt` again

**Build errors?**
- Make sure you have Node.js 18+ installed
- Try `npm install` in the frontend folder again

## Technology

- **Backend**: Python + FastAPI + SQLAlchemy + SQLite
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Auth**: JWT tokens
- **UI**: Hebrew RTL with family-friendly design

## API Documentation

FastAPI provides automatic interactive documentation:
- Swagger UI: http://localhost:3000/docs
- ReDoc: http://localhost:3000/redoc

## Testing Reminders

To manually test the reminder system (without waiting until 22:00):

```bash
cd backend
venv\Scripts\activate
python test_reminders.py
```

This will trigger the reminder emails immediately. Check your console for output (or inbox if SendGrid/SMTP is configured).

Enjoy managing your family's caregiving tasks! 💙

## Debug Mode (Backend & Frontend)

Enable debug logs and panel:

Backend:
```
# backend/.env
DEBUG=1
```
Restart the backend. You will see per-request logs and `/api/debug/health` will return `{ debug: true }`.

Frontend:
- Open the app, run in the browser console:
```
localStorage.setItem('debug', '1'); location.reload();
```
- A small Hebrew "Debug" panel will appear (bottom-left) showing user, family, token, and API debug state.
- To disable:
```
localStorage.removeItem('debug'); location.reload();
```

## VS Code Debugging (Breakpoints)

Launch directly from VS Code using ready configs (see `.vscode/launch.json`):

- Backend (Python):
  1) Open Run and Debug (Ctrl+Shift+D)
  2) Choose "Backend: Launch FastAPI"
  3) Press F5 and set breakpoints in `backend/`

- Backend (Attach alternative):
  1) In terminal: `cd backend && venv\Scripts\activate && python -m debugpy --listen 5678 --wait-for-client main.py`
  2) In VS Code choose "Backend: Attach (debugpy 5678)" and start

- Frontend (Chrome):
  1) Start dev server: `npm run dev` in `frontend/`
  2) Choose "Frontend: Launch Chrome to http://localhost:5173"
  3) Set breakpoints in `.tsx` files

## Full‑Stack Debugging (Frontend + Backend together)

Use the combined VS Code configuration:

1) Start the frontend dev server:
```
cd frontend
npm run dev
```

2) In VS Code → Run and Debug (Ctrl+Shift+D):
- Select "Full Stack: Backend + Frontend"
- Press F5

This launches the FastAPI backend (with DEBUG=1) and a Chrome session pointing to `http://localhost:5173` so you can set breakpoints in both Python (backend) and React/TypeScript (frontend) at the same time.

