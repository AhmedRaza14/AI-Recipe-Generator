from fastapi import APIRouter
from app.services.ai_service import ai_service
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Handle cooking-related chat queries"""
    try:
        response = await ai_service.chat_response(
            request.message,
            request.context
        )
        return {"response": response}
    except ValueError as e:
        return {"response": str(e)}
