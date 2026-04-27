"""
Agent 2 — Assumption Mapper.

Identifies every unproven or under-evidenced claim in the structured
startup pitch. Returns an ordered list of assumption dicts (high→low risk).
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from utils.json_cleaner import clean_and_parse_json

import google.generativeai as genai
import os

from pipeline.state import PipelineState

logger = logging.getLogger(__name__)

_MODEL_NAME = "gemini-flash-latest"
_MAX_TOKENS = 4096

_SYSTEM_PROMPT = """\
You are a critical analyst reviewing startup pitches.
Given a structured pitch, identify every claim that is unproven, \
assumed without evidence, or glossed over. For each assumption, output:
{ "assumption": str, "category": str, "risk_level": "high"|"medium"|"low", \
"why_unproven": str }
Return a JSON array. Order by risk_level descending. \
Identify at least 5 and no more than 12 assumptions.\
"""


async def run_assumption_mapper(state: PipelineState) -> PipelineState:
    """
    Agent 2: Map unproven / risky assumptions from the structured pitch using Gemini.
    """
    genai.configure(api_key=os.environ["GEMINI_API"])
    focus_area = state.get("focus_area", "general")
    
    focus_instructions = {
        "general": "Identify a broad range of assumptions across market, tech, and finance.",
        "technical": "Prioritize technical assumptions, product scalability claims, and IP-related risks.",
        "financial": "Prioritize unit economic claims, revenue growth projections, and burn rate assumptions.",
        "market": "Prioritize TAM/SAM claims, customer acquisition velocity assumptions, and competitive moats."
    }
    
    current_focus_instruction = focus_instructions.get(focus_area, focus_instructions["general"])

    model = genai.GenerativeModel(
        model_name=_MODEL_NAME,
        system_instruction=_SYSTEM_PROMPT + f"\n\nFOCUS GUIDANCE: {current_focus_instruction}"
    )
    
    user_content = json.dumps(state["structured"], ensure_ascii=False)
    start = time.perf_counter()

    try:
        response = await model.generate_content_async(
            user_content,
            generation_config=genai.GenerationConfig(
                max_output_tokens=_MAX_TOKENS,
                response_mime_type="application/json",
            )
        )
    except Exception as exc:
        logger.error("[assumption_mapper] Gemini API failed: %s", exc)
        raise RuntimeError(f"[assumption_mapper] Gemini API failed: {exc}")

    elapsed_ms = int((time.perf_counter() - start) * 1000)
    raw_content = response.text

    try:
        assumptions = clean_and_parse_json(raw_content)
        if not isinstance(assumptions, list):
            raise ValueError("Expected a JSON array")
    except Exception as exc:
        raise ValueError(
            f"[assumption_mapper] JSON parse failed: {exc}\nRaw: {raw_content[:300]}"
        ) from exc

    token_counts = dict(state.get("token_counts") or {})
    latencies_ms = dict(state.get("latencies_ms") or {})
    
    # Gemini usage metadata
    usage = response.usage_metadata
    token_counts["agent_2"] = usage.total_token_count
    latencies_ms["agent_2"] = elapsed_ms

    return {
        **state,
        "assumptions": assumptions,
        "token_counts": token_counts,
        "latencies_ms": latencies_ms,
    }
