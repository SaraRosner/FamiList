# FamiList 💙

**FamiList** is a family coordination tool for managing caregiving tasks for elderly parents. The system enables multiple family members to collaborate on caregiving through voluntary task assignment, progress tracking, and fairness monitoring.

## 🌟 Features

- **Multi-tenant Architecture**: Each family has its own private workspace
- **Voluntary Task System**: Family members volunteer for tasks (no forced assignments)
- **Hebrew RTL Interface**: Full Hebrew UI with right-to-left layout
- **Task Management**: Create, claim, and complete caregiving tasks
- **Fairness Reports**: Track contributions and progress of each family member
- **Priority Levels**: Organize tasks by urgency (high, medium, low)
- **Reminders**: Automatic reminder system for tasks and reports
- **Family-Friendly Language**: Non-judgmental, supportive messaging
- **Family Chat**: Create chat threads for family communication
- **Family Events**: Plan and track upcoming family events
- **Combined Calendar**: Monthly and weekly views showing tasks and events together
- **Care Records**: Log and review caregiver observations over time

## 📋 Core Screens

1. **Login/Register** - Authentication with email and password
2. **Family Setup** - Create a new family or join an existing one
3. **Task Board** - Three columns:
   - משימות ללא בעלים (Unclaimed Tasks)
   - המשימות שלי (My Tasks)
   - בוצעו (Completed)
4. **Reports** - Fairness statistics, open tasks, recent completions
5. **Records (רשומות)** - Log and review caregiver observations (mental/cognitive events)
6. **Chat (צ'אטים)** - Family chat threads for communication
7. **Family Events (אירועים משפחתיים)** - Plan and manage upcoming family events
8. **Calendar (יומן)** - Combined monthly/weekly view of tasks and events

## 🛠️ Technology Stack

### Backend
- **Python** with FastAPI
- **SQLAlchemy** ORM
- **SQLite** database
- **JWT** authentication (PyJWT)
- **passlib** for password hashing (PBKDF2-SHA256)
- **APScheduler** for scheduled tasks

### Frontend
- **React** with TypeScript
- **Vite** as build tool
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls

## 📦 Installation

### Prerequisites
- Python 3.9+
- Node.js 18+ (for frontend)
- npm or yarn

### Step 1: Install Backend Dependencies

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 3: Configure Environment

The backend requires environment variables. An `.env` file has been created in the `backend` folder with default values:

```env
PORT=3000
JWT_SECRET=familist-secret-key-change-in-production-12345
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAYS=7
DATABASE_URL=sqlite:///./familist.db
```

**⚠️ Important**: Change the `JWT_SECRET` in production!

## 🚀 Running the Application

### Development Mode

You need to run both backend and frontend servers:

**Terminal 1 - Backend:**
```bash
cd backend

# Make sure virtual environment is activated
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Run server
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/docs

### Production Mode

**Backend:**
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 3000
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 📖 User Guide

### Getting Started

1. **Register**: Create a new account with email and password
2. **Create or Join Family**: 
   - Create a new family if you're the first member
   - Join an existing family if it was already created
3. **Start Managing Tasks**: You'll be redirected to the main dashboard

### Managing Tasks

**Creating a Task:**
1. Click "משימה חדשה" (+ New Task)
2. Fill in:
   - Title (required)
   - Description (optional)
   - Priority (low/medium/high)
   - Due date (optional)
3. Click "צור משימה" (Create Task)

**Volunteering for a Task:**
1. Find a task in the "משימות ללא בעלים" (Unclaimed Tasks) column
2. Click "אני אקח את זה 💪" (I'll take this)
3. The task moves to "המשימות שלי" (My Tasks)

**Completing a Task:**
1. Click "✓ סיימתי" (I finished) on your task
2. The task moves to "בוצעו" (Completed)

**Unvolunteering:**
- If you can't complete a task, click "בטל" (Cancel) to return it to unclaimed

### Viewing Reports

1. Navigate to "דוחות" (Reports) from the top menu
2. Select time period:
   - שבוע אחרון (Last Week)
   - חודש אחרון (Last Month)
   - כל הזמן (All Time)
3. View contribution statistics for each family member
4. Review open tasks and recent completions

### Recording Caregiver Events (Records)

1. Navigate to "רשומות" (Records) from the top menu
2. Fill in:
   - Subject (סבא/סבתא)
   - When it happened
   - Severity (low/medium/high)
   - Category (optional)
   - Description of the event
3. Submit the event and it joins the timeline
4. Use the filters (1/3/6/12 months, per-subject) to review trends for early signs of decline

### Family Chat

1. Navigate to "צ'אטים" (Chats) from the top menu
2. Create a new chat thread with a custom title
3. Send messages in real-time
4. All family members can participate in the conversation

### Family Events

1. Navigate to "אירועים משפחתיים" (Family Events) from the top menu
2. Click "הוסף אירוע משפחתי" (Add Family Event)
3. Fill in:
   - Title (required)
   - Description (optional)
   - Start date and time (required)
   - End date and time (optional)
4. View all upcoming events in chronological order
5. Edit or delete events as needed

### Calendar View

1. Navigate to "יומן" (Calendar) from the top menu
2. Switch between monthly and weekly views
3. See all tasks (with due dates) and family events in one view
4. Click on any item to view details
5. Navigate between months/weeks using arrow buttons
6. Tasks are color-coded by priority, events are shown in blue

## 🗄️ Database Schema

The application uses SQLite with SQLAlchemy ORM with the following tables:

- **families**: Family information
- **users**: User accounts and family memberships
- **tasks**: Caregiving tasks
- **task_history**: Task action history for tracking
- **reminders**: Scheduled reminders
- **events**: Logged caregiver observations/records (subject, severity, description, recorder, timestamps)
- **chat_threads**: Family chat conversation threads
- **chat_messages**: Messages within chat threads
- **family_events**: Upcoming family events (title, description, start/end dates)

## 🔒 Security

- Passwords are hashed using passlib (PBKDF2-SHA256)
- JWT tokens for authentication (PyJWT)
- Environment variables for sensitive data
- CORS enabled for frontend-backend communication
- Pydantic for request/response validation

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login

### Family Management
- `POST /api/family/create` - Create family
- `POST /api/family/join/:familyId` - Join family
- `GET /api/family` - Get family info
- `GET /api/family/list` - List all families

### Tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks` - Get family tasks
- `POST /api/tasks/:taskId/volunteer` - Volunteer for task
- `POST /api/tasks/:taskId/unvolunteer` - Unvolunteer from task
- `POST /api/tasks/:taskId/complete` - Complete task

### Reports
- `GET /api/reports/fairness` - Get fairness statistics
- `GET /api/reports/open` - Get unclaimed/in-progress tasks breakdown

### Events (Care Records)
- `POST /api/events` - Log a new caregiver event
- `GET /api/events?months=3&subject=grandfather` - Fetch recent events with filters (months default 1)

### Chat
- `GET /api/chat/threads` - Get all chat threads for the family
- `POST /api/chat/threads` - Create a new chat thread
- `GET /api/chat/threads/{thread_id}` - Get thread with messages
- `POST /api/chat/threads/{thread_id}/messages` - Send a message in a thread

### Family Events
- `GET /api/family-events` - Get all family events (chronological order)
- `POST /api/family-events` - Create a new family event
- `PUT /api/family-events/{event_id}` - Update a family event
- `DELETE /api/family-events/{event_id}` - Delete a family event

### Calendar
- `GET /api/calendar?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - Get tasks and events for date range

## 🎨 UI/UX Principles

- **Hebrew-first**: All user-facing text in Hebrew
- **RTL Layout**: Right-to-left design throughout
- **Non-judgmental**: Encouraging language (e.g., "Would you like to take this?" vs "You were assigned")
- **Family-friendly**: Warm, supportive tone
- **Simple and Clear**: Easy navigation for all ages

## 🔄 Reminder System

The backend includes an APScheduler-based reminder service that:
- Checks for pending reminders every minute
- Can be extended to send emails/SMS via integration with services like:
  - SendGrid / AWS SES for emails
  - Twilio for SMS

## 📚 API Documentation

FastAPI provides automatic interactive API documentation:
- **Swagger UI**: http://localhost:3000/docs - Interactive API testing
- **ReDoc**: http://localhost:3000/redoc - API reference documentation

## 🚧 Future Enhancements

- Email/SMS integration for reminders
- Push notifications
- Mobile app (React Native)
- Real-time chat updates (WebSockets)
- Calendar notifications for upcoming events
- Photo sharing for task completion
- Visit scheduling for grandchildren
- Medication tracking
- Medical appointment management
- Task recurrence/scheduling

## 📝 License

MIT License - feel free to use and modify for your needs.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## 💬 Support

For questions or issues, please open an issue on the repository.

---

**Made with ❤️ for families caring for their elderly parents**

