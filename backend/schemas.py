from pydantic import BaseModel, EmailStr
from typing import Optional, List, Literal
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    family_id: Optional[int] = None
    role: str
    
    class Config:
        orm_mode = True

class UserWithToken(BaseModel):
    user: UserResponse
    token: str

# Family Schemas
class FamilyCreate(BaseModel):
    name: str

class FamilyResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    
    class Config:
        orm_mode = True

class FamilyWithMembers(BaseModel):
    family: FamilyResponse
    members: List[UserResponse]

class FamilyWithToken(BaseModel):
    family: FamilyResponse
    user: UserResponse
    token: str

# Task Schemas
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    dueDate: Optional[str] = None

class TaskResponse(BaseModel):
    id: int
    family_id: int
    title: str
    description: Optional[str]
    priority: str
    status: str
    created_by: int
    volunteer_id: Optional[int]
    volunteered_at: Optional[datetime]
    completed_at: Optional[datetime]
    due_date: Optional[datetime]
    created_at: datetime
    creator_name: str
    volunteer_name: Optional[str]
    
    class Config:
        orm_mode = True

class TaskListResponse(BaseModel):
    tasks: List[TaskResponse]

class TaskUpdateResponse(BaseModel):
    task: TaskResponse

# Report Schemas
class UserStats(BaseModel):
    user_id: int
    user_name: str
    completed_count: int

class FairnessReport(BaseModel):
    period: str
    stats: List[UserStats]
    members: List[UserResponse]

# Event Schemas
class EventBase(BaseModel):
    subject: str
    occurred_at: datetime
    severity: str
    category: Optional[str] = None
    description: str

class EventCreate(EventBase):
    pass

class EventResponse(EventBase):
    id: int
    family_id: int
    recorded_by: int
    recorder_name: str
    created_at: datetime

    class Config:
        orm_mode = True

class EventListResponse(BaseModel):
    events: List[EventResponse]

# Chat Schemas
class ChatThreadCreate(BaseModel):
    title: str

class ChatMessageCreate(BaseModel):
    message: str

class ChatMessageResponse(BaseModel):
    id: int
    thread_id: int
    sender_id: int
    sender_name: str
    message: str
    created_at: datetime

    class Config:
        orm_mode = True

class ChatThreadResponse(BaseModel):
    id: int
    family_id: int
    created_by: int
    created_by_name: str
    title: str
    created_at: datetime
    updated_at: datetime
    last_message: Optional[ChatMessageResponse] = None

    class Config:
        orm_mode = True

class ChatThreadWithMessages(BaseModel):
    thread: ChatThreadResponse
    messages: List[ChatMessageResponse]

class ChatThreadListResponse(BaseModel):
    threads: List[ChatThreadResponse]

# Family Event Schemas
class FamilyEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None

class FamilyEventResponse(BaseModel):
    id: int
    family_id: int
    created_by: int
    created_by_name: str
    title: str
    description: Optional[str]
    start_date: datetime
    end_date: Optional[datetime]
    created_at: datetime

    class Config:
        orm_mode = True

class FamilyEventListResponse(BaseModel):
    events: List[FamilyEventResponse]

# Generic Response
class MessageResponse(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    error: str


# Member management schemas
MemberRole = Literal["ADMIN", "MEMBER", "RESTRICTED"]


class MemberCreate(BaseModel):
    name: str
    email: EmailStr
    role: MemberRole = "MEMBER"


class MemberRoleUpdate(BaseModel):
    role: MemberRole
