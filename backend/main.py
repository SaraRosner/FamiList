from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import init_db
from reminder_service import start_reminder_service, stop_reminder_service
from routers import (
    auth_routes,
    family_routes,
    task_routes,
    report_routes,
    event_routes,
    chat_routes,
    family_event_routes,
    calendar_routes,
    member_routes,
)
from config import settings
import time

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    print("Starting FamiList API...")
    init_db()
    start_reminder_service()
    yield
    # Shutdown
    stop_reminder_service()
    print("Shutting down FamiList API...")

app = FastAPI(
    title="FamiList API",
    description="Family coordination tool for managing caregiving tasks",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_routes.router, prefix="/api")
app.include_router(family_routes.router, prefix="/api")
app.include_router(task_routes.router, prefix="/api")
app.include_router(report_routes.router, prefix="/api")
app.include_router(event_routes.router, prefix="/api")
app.include_router(chat_routes.router, prefix="/api")
app.include_router(family_event_routes.router, prefix="/api")
app.include_router(calendar_routes.router, prefix="/api")
app.include_router(member_routes.router, prefix="/api")

# Debug request logging middleware
if settings.DEBUG:
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        duration_ms = int((time.time() - start_time) * 1000)
        try:
            path = request.url.path
        except Exception:
            path = "<unknown>"
        print(f"[DEBUG] {request.method} {path} -> {response.status_code} ({duration_ms}ms)")
        return response

    @app.get("/api/debug/health")
    def debug_health():
        return {"status": "ok", "debug": True}

@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "FamiList API is running"}

if __name__ == "__main__":
    import uvicorn
    from config import settings
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)

