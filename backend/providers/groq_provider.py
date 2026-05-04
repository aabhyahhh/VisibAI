"""
Groq provider — real Groq API (llama-3.3-70b-versatile).
Also used for internal LLM tasks (entity validation, chat).
"""
from __future__ import annotations
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

_api_key = os.getenv("GROQ_API_KEY")
_client  = Groq(api_key=_api_key) if _api_key else None

# Model for main query responses (shown in Groq tab)
QUERY_MODEL = "llama-3.3-70b-versatile"
# Model for internal tasks (entity extraction, chat) — faster/cheaper
INTERNAL_MODEL = "llama3-8b-8192"


async def query_groq(
    user_prompt: str,
    model: str = QUERY_MODEL,
    system_prompt: str | None = None,
    # legacy alias — kept so chat route doesn't break
    model_key: str | None = None,
    prompt: str | None = None,
) -> str:
    if _client is None:
        raise ValueError("GROQ_API_KEY not configured")

    content = user_prompt or prompt or ""

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": content})

    try:
        response = _client.chat.completions.create(
            model=model,
            messages=messages,
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        raise ValueError(f"Groq query failed: {e}")


async def query_groq_internal(
    user_prompt: str,
    system_prompt: str | None = None,
) -> str:
    """Lightweight call for entity validation + chat — uses smaller model."""
    return await query_groq(
        user_prompt=user_prompt,
        model=INTERNAL_MODEL,
        system_prompt=system_prompt,
    )
