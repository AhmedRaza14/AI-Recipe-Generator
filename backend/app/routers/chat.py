from fastapi import APIRouter, Depends, HTTPException
from app.services.ai_service import ai_service
from app.schemas.chat import ChatRequest, ChatResponse
from app.dependencies import get_current_user

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, current_user=Depends(get_current_user)):
    """Handle cooking-related chat queries (requires authentication)"""
    try:
        response = await ai_service.chat_response(
            request.message,
            request.context
        )
        return {"response": response}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to process chat request")
