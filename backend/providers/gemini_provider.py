"""
Google Gemini provider — gemini-2.0-flash via the current google-genai SDK.
"""
from __future__ import annotations
import os
import asyncio
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

_api_key = os.getenv("GEMINI_API_KEY")
_client  = genai.Client(api_key=_api_key) if _api_key else None

MODEL = "gemini-2.0-flash"


async def query_gemini(
    user_prompt: str,
    system_prompt: str | None = None,
) -> str:
    if _client is None:
        raise ValueError("GEMINI_API_KEY not configured")

    def _sync_call() -> str:
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
        ) if system_prompt else None

        response = _client.models.generate_content(
            model=MODEL,
            contents=user_prompt,
            config=config,
        )
        return response.text or ""

    try:
        return await asyncio.to_thread(_sync_call)
    except Exception as e:
        raise ValueError(f"Gemini query failed: {e}")
