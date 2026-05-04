from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from providers.groq_provider import query_groq_internal

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    context: dict = {}


@router.post("/api/chat")
async def chat(body: ChatRequest):
    ctx = body.context
    why_lost = ctx.get("why_lost", [])
    why_lost_text = "\n".join(f"- {w}" for w in why_lost) if why_lost else "N/A"

    system_prompt = (
        "You are an AEO (Answer Engine Optimization) expert assistant. "
        "Help the user understand and improve their AI search visibility with "
        "concrete, actionable advice.\n\n"
        "Current analysis context:\n"
        f"- Query: {ctx.get('query', 'N/A')}\n"
        f"- Business: {ctx.get('business_name', 'N/A')}\n"
        f"- AEO Score: {ctx.get('score', 'N/A')}/100\n"
        f"- Visibility: {ctx.get('visibility', 'N/A')}\n"
        f"- Confidence: {ctx.get('confidence', 'N/A')}\n"
        f"- Top competitors: {', '.join(ctx.get('competitors', [])) or 'N/A'}\n"
        f"- Why they are losing:\n{why_lost_text}\n"
    )

    try:
        reply = await query_groq_internal(
            user_prompt=body.message,
            system_prompt=system_prompt,
        )
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
