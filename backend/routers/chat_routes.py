from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from models import ChatThread, ChatMessage, User
from schemas import (
    ChatThreadCreate, ChatMessageCreate, ChatMessageResponse, ChatThreadResponse,
    ChatThreadWithMessages, ChatThreadListResponse
)
from auth import get_current_user_with_family

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.get("/threads", response_model=ChatThreadListResponse)
def list_threads(
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db)
):
    """Get all chat threads for the family"""
    threads = db.query(ChatThread).filter(
        ChatThread.family_id == current_user.family_id
    ).order_by(desc(ChatThread.updated_at)).all()
    
    thread_responses = []
    for thread in threads:
        # Get last message
        last_msg = db.query(ChatMessage).filter(
            ChatMessage.thread_id == thread.id
        ).order_by(desc(ChatMessage.created_at)).first()
        
        last_message_response = None
        if last_msg:
            sender = db.query(User).filter(User.id == last_msg.sender_id).first()
            last_message_response = ChatMessageResponse(
                id=last_msg.id,
                thread_id=last_msg.thread_id,
                sender_id=last_msg.sender_id,
                sender_name=sender.name if sender else "Unknown",
                message=last_msg.message,
                created_at=last_msg.created_at
            )
        
        creator = db.query(User).filter(User.id == thread.created_by).first()
        thread_responses.append(ChatThreadResponse(
            id=thread.id,
            family_id=thread.family_id,
            created_by=thread.created_by,
            created_by_name=creator.name if creator else "Unknown",
            title=thread.title,
            created_at=thread.created_at,
            updated_at=thread.updated_at,
            last_message=last_message_response
        ))
    
    return ChatThreadListResponse(threads=thread_responses)


@router.post("/threads", response_model=ChatThreadResponse, status_code=status.HTTP_201_CREATED)
def create_thread(
    thread_data: ChatThreadCreate,
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db)
):
    """Create a new chat thread"""
    thread = ChatThread(
        family_id=current_user.family_id,
        created_by=current_user.id,
        title=thread_data.title
    )
    db.add(thread)
    db.commit()
    db.refresh(thread)
    
    return ChatThreadResponse(
        id=thread.id,
        family_id=thread.family_id,
        created_by=thread.created_by,
        created_by_name=current_user.name,
        title=thread.title,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
        last_message=None
    )


@router.get("/threads/{thread_id}", response_model=ChatThreadWithMessages)
def get_thread(
    thread_id: int,
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db)
):
    """Get a chat thread with all its messages"""
    thread = db.query(ChatThread).filter(
        ChatThread.id == thread_id,
        ChatThread.family_id == current_user.family_id
    ).first()
    
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread not found"
        )
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.thread_id == thread_id
    ).order_by(ChatMessage.created_at).all()
    
    creator = db.query(User).filter(User.id == thread.created_by).first()
    message_responses = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        message_responses.append(ChatMessageResponse(
            id=msg.id,
            thread_id=msg.thread_id,
            sender_id=msg.sender_id,
            sender_name=sender.name if sender else "Unknown",
            message=msg.message,
            created_at=msg.created_at
        ))
    
    return ChatThreadWithMessages(
        thread=ChatThreadResponse(
            id=thread.id,
            family_id=thread.family_id,
            created_by=thread.created_by,
            created_by_name=creator.name if creator else "Unknown",
            title=thread.title,
            created_at=thread.created_at,
            updated_at=thread.updated_at,
            last_message=message_responses[-1] if message_responses else None
        ),
        messages=message_responses
    )


@router.post("/threads/{thread_id}/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    thread_id: int,
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user_with_family),
    db: Session = Depends(get_db)
):
    """Send a message in a chat thread"""
    thread = db.query(ChatThread).filter(
        ChatThread.id == thread_id,
        ChatThread.family_id == current_user.family_id
    ).first()
    
    if not thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thread not found"
        )
    
    message = ChatMessage(
        thread_id=thread_id,
        sender_id=current_user.id,
        message=message_data.message
    )
    db.add(message)
    
    # Update thread's updated_at
    from datetime import datetime, timezone
    thread.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(message)
    
    return ChatMessageResponse(
        id=message.id,
        thread_id=message.thread_id,
        sender_id=message.sender_id,
        sender_name=current_user.name,
        message=message.message,
        created_at=message.created_at
    )

