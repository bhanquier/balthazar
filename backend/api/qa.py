from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from qa import answer_question, check_status

router = APIRouter()

class QARequest(BaseModel):
    question: str
    top_k: int = 5
    use_rerank: bool = True
    provider: str = "gemini"

@router.post("")
def qa_endpoint(req: QARequest):
    return answer_question(
        req.question, 
        req.top_k, 
        req.use_rerank, 
        req.provider
    )

@router.get("/status")
def status_endpoint():
    return check_status()