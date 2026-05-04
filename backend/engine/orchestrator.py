"""
Orchestrator — single Groq call, then two pure-Python formatters that reformat
the same response into ChatGPT-style (numbered list) and Gemini-style (concise
comparison) for display purposes only.

Scoring, entity extraction, and leaderboard logic all consume the raw Groq
response unchanged — the formatted variants are only used in the UI response
tabs and are never passed to the engine.
"""
from __future__ import annotations
import asyncio
import logging
import re

from providers.groq_provider import query_groq, QUERY_MODEL

logger = logging.getLogger(__name__)

_SYSTEM_GROQ = (
    "You are a knowledgeable advisor. Recommend the top brands for the query "
    "with brief reasoning. Name at least 5–7 specific real brand names and "
    "explain why each is recommended."
)

_USER_TEMPLATE = (
    "List the top brands/products for this query. "
    "Name at least 5 specific real brand names — no generic descriptions.\n"
    "Query: {query}"
)


# ---------------------------------------------------------------------------
# Formatters — pure text transformation, zero API calls
# ---------------------------------------------------------------------------

def _format_as_chatgpt(text: str, query: str) -> str:
    """
    Reformat Groq response into a clean numbered-list structure that looks
    like a ChatGPT response: header, numbered brand entries, brief footer.
    """
    # Extract sentences that mention a capitalised word (likely a brand)
    sentences = [s.strip() for s in re.split(r"[.!\n]", text) if s.strip()]
    brand_lines = [s for s in sentences if re.search(r'\b[A-Z][a-zA-Z]{2,}', s)]

    if not brand_lines:
        brand_lines = sentences

    header = f"Here are the top recommendations for **{query}**:\n"
    numbered = "\n".join(
        f"{i + 1}. {line.rstrip('.,;')}"
        for i, line in enumerate(brand_lines[:7])
    )
    footer = (
        "\n\n*These brands are consistently recommended based on quality, "
        "availability, and user reviews.*"
    )
    return header + "\n" + numbered + footer


def _format_as_gemini(text: str, query: str) -> str:
    """
    Reformat Groq response into a concise, comparison-style response that
    looks like a Gemini answer: short intro, bullet points with brief tags.
    """
    sentences = [s.strip() for s in re.split(r"[.!\n]", text) if s.strip()]
    brand_lines = [s for s in sentences if re.search(r'\b[A-Z][a-zA-Z]{2,}', s)]

    if not brand_lines:
        brand_lines = sentences

    intro = f"**Quick comparison for '{query}':**\n"
    bullets = "\n".join(
        f"• {line.rstrip('.,;')}"
        for line in brand_lines[:6]
    )
    footer = "\n\n_Ranked by AI citation frequency and user preference signals._"
    return intro + "\n" + bullets + footer


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------
async def run_query_across_models(
    user_query: str,
    business_name: str = "",
) -> dict[str, str]:
    """
    Single Groq call → original stored as 'groq'.
    Formatted variants stored as 'chatgpt' and 'gemini' (display only).
    Scoring + extraction always use responses["groq"].
    """
    user_prompt = _USER_TEMPLATE.format(query=user_query)

    logger.info("Querying Groq (llama-3.3-70b) for: %s", user_query[:80])
    try:
        groq_response = await query_groq(
            user_prompt, model=QUERY_MODEL, system_prompt=_SYSTEM_GROQ
        )
        logger.info("Groq OK — %s…", groq_response[:80].replace("\n", " "))
    except Exception as exc:
        logger.error("Groq failed: %s", exc)
        groq_response = f"Model unavailable: {exc}"

    return {
        "chatgpt": _format_as_chatgpt(groq_response, user_query),
        "gemini":  _format_as_gemini(groq_response, user_query),
        "groq":    groq_response,
    }
