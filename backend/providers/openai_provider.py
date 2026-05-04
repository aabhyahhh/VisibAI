"""
OpenAI provider — real ChatGPT (gpt-4o-mini) calls.
"""
from __future__ import annotations
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

_api_key = os.getenv("OPENAI_API_KEY")
_client  = AsyncOpenAI(api_key=_api_key) if _api_key else None

MODEL = "gpt-4o-mini"


async def query_openai(
    user_prompt: str,
    system_prompt: str | None = None,
) -> str:
    if _client is None:
        raise ValueError("OPENAI_API_KEY not configured")

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": user_prompt})

    try:
        response = await _client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.7,
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        raise ValueError(f"OpenAI query failed: {e}")
