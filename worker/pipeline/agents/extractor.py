"""
Agent 1 — Structured Extractor.

Extracts well-defined startup deck fields from raw pitch text using
Claude Sonnet. Returns only valid JSON; null for absent fields.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
import os

import google.generativeai as genai

from pipeline.state import PipelineState
from utils.json_cleaner import clean_and_parse_json

logger = logging.getLogger(__name__)

_MODEL_NAME = "gemini-flash-latest"
_MAX_TOKENS = 4096

_SYSTEM_PROMPT = """\
You are a structured data extractor for startup pitch decks.
Extract exactly these fields from the pitch text: problem, solution, \
target_market, market_size, competitors (list), gtm_strategy, \
team_description, revenue_model, financials_summary, vertical.
For `vertical`, infer the startup's category as a lowercase underscore slug \
(e.g. 'logistics_saas', 'fintech', 'edtech', 'healthtech', 'ecommerce', \
'b2b_saas', 'dtc_consumer', 'proptech', 'legaltech', 'climate_tech', 'other').
Return only valid JSON. If a field is not present in the deck, \
use null. Do not invent information.\
"""


async def run_extractor(state: PipelineState) -> PipelineState:
    """
    Agent 1: Extract structured fields from raw pitch deck text using Gemini.
    """
    genai.configure(api_key=os.environ["GEMINI_API"])
    model = genai.GenerativeModel(
        model_name=_MODEL_NAME,
        system_instruction=_SYSTEM_PROMPT
    )
    
    start = time.perf_counter()

    try:
        response = await model.generate_content_async(
            state["raw_text"],
            generation_config=genai.GenerationConfig(
                max_output_tokens=_MAX_TOKENS,
                response_mime_type="application/json",
            )
        )
    except Exception as exc:
        logger.error("[extractor] Gemini API failed: %s", exc)
        raise RuntimeError(f"[extractor] Gemini API failed: {exc}")

    elapsed_ms = int((time.perf_counter() - start) * 1000)
    raw_content = response.text

    try:
        structured = clean_and_parse_json(raw_content)
        if isinstance(structured, list) and len(structured) > 0:
            structured = structured[0]
    except Exception as exc:
        raise ValueError(f"[extractor] JSON parse failed: {exc}\nRaw: {raw_content[:300]}") from exc

    token_counts = dict(state.get("token_counts") or {})
    latencies_ms = dict(state.get("latencies_ms") or {})
    
    # Gemini usage metadata
    usage = response.usage_metadata
    token_counts["agent_1"] = usage.total_token_count
    latencies_ms["agent_1"] = elapsed_ms

    # Promote AI-detected vertical into top-level state so downstream nodes use it
    detected_vertical = structured.get("vertical") or state.get("vertical") or "other"

    return {
        **state,
        "structured": structured,
        "vertical": detected_vertical,
        "token_counts": token_counts,
        "latencies_ms": latencies_ms,
    }
