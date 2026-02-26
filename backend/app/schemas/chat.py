from pydantic import BaseModel
from typing import Optional, List


class ChatRequest(BaseModel):
    message: str
    context: Optional[List[dict]] = None


class ChatResponse(BaseModel):
    response: str
