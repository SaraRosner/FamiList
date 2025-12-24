# FamiList Backend (Python/FastAPI)

## Setup

### 1. Create Virtual Environment

```bash
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

Create a `.env` file or use the existing one:

```env
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAYS=7
DATABASE_URL=sqlite:///./familist.db
```

## Running the Server

### Development Mode (with auto-reload)

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --port 3000
```

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 3000
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3000/docs
- **ReDoc**: http://localhost:3000/redoc

## Project Structure

```
backend/
├── main.py              # FastAPI application entry point
├── config.py            # Configuration settings
├── database.py          # Database connection and session
├── models.py            # SQLAlchemy database models
├── schemas.py           # Pydantic schemas for validation
├── auth.py              # Authentication utilities
├── reminder_service.py  # Scheduled reminder service
├── routers/
│   ├── auth_routes.py   # Authentication endpoints
│   ├── family_routes.py # Family management endpoints
│   ├── task_routes.py   # Task management endpoints
│   └── report_routes.py # Reports endpoints
├── requirements.txt     # Python dependencies
└── .env                 # Environment variables
```

## Technologies

- **FastAPI**: Modern, fast web framework
- **SQLAlchemy**: SQL toolkit and ORM
- **Pydantic**: Data validation using Python type annotations
- **PyJWT**: JWT token implementation
- **passlib**: Password hashing (PBKDF2-SHA256)
- **APScheduler**: Scheduled task execution
- **Uvicorn**: ASGI server

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Family Management
- `POST /api/family/create` - Create new family
- `POST /api/family/join/{family_id}` - Join existing family
- `GET /api/family` - Get family information
- `GET /api/family/list` - List all families

### Tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks` - Get all family tasks
- `POST /api/tasks/{task_id}/volunteer` - Volunteer for task
- `POST /api/tasks/{task_id}/unvolunteer` - Unvolunteer from task
- `POST /api/tasks/{task_id}/complete` - Mark task as complete

### Reports
- `GET /api/reports/fairness?period=week|month|all` - Get fairness statistics

### Health
- `GET /api/health` - Health check

## Email Notifications (Optional)

The backend can send Hebrew email notifications to all family members when a new task is created.

You can configure either SMTP or SendGrid. If neither is configured, emails are logged to the console.

SMTP example (Gmail):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM_EMAIL=your@gmail.com
SMTP_FROM_NAME=FamiList
```

SendGrid (recommended):
```
SENDGRID_API_KEY=SG.xxxxxxxx
SMTP_FROM_EMAIL=your@domain.com
SMTP_FROM_NAME=FamiList
```

Security notes:
- Gmail SMTP: use an App Password (not your main password).
- SendGrid: create an API Key with "Mail Send" permission only.

## Database

The application uses SQLite by default. The database file `familist.db` will be created automatically on first run.

To reset the database, simply delete `familist.db` and restart the server.

## Scheduled Tasks

The reminder service runs in the background and checks for pending reminders every minute.

To extend it with email/SMS:
- Integrate SendGrid/AWS SES for emails
- Integrate Twilio for SMS
- Update `reminder_service.py` to send actual notifications

