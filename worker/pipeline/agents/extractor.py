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

import anthropic

from pipeline.state import PipelineState

logger = logging.getLogger(__name__)

_MODEL = "claude-sonnet-4-5"
_MAX_TOKENS = 1500
_RETRIES = 2
_BACKOFF_S = 2

_SYSTEM_PROMPT = """\
You are a structured data extractor for startup pitch decks.
Extract exactly these fields from the pitch text: problem, solution, \
target_market, market_size, competitors (list), gtm_strategy, \
team_description, revenue_model, financials_summary.
Return only valid JSON. If a field is not present in the deck, \
use null. Do not invent information.\
"""


async def run_extractor(state: PipelineState) -> PipelineState:
    """
    Agent 1: Extract structured fields from raw pitch deck text.

    Updates state['structured'] with a parsed JSON dict.
    Records token usage in state['token_counts']['agent_1'] and
    latency in state['latencies_ms']['agent_1'].
    """
    client = anthropic.AsyncAnthropic()
    start = time.perf_counter()

    response = None
    last_exc: Exception | None = None

    for attempt in range(_RETRIES + 1):
        try:
            response = await client.messages.create(
                model=_MODEL,
                max_tokens=_MAX_TOKENS,
                system=_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": state["raw_text"]}],
            )
            break
        except anthropic.APIStatusError as exc:
            last_exc = exc
            logger.warning("extractor attempt %d failed: %s", attempt + 1, exc)
            if attempt < _RETRIES:
                await asyncio.sleep(_BACKOFF_S)
    else:
        raise RuntimeError(f"[extractor] API failed after {_RETRIES + 1} attempts: {last_exc}")

    elapsed_ms = int((time.perf_counter() - start) * 1000)
    raw_content = response.content[0].text

    try:
        structured = json.loads(raw_content)
    except json.JSONDecodeError as exc:
        raise ValueError(f"[extractor] JSON parse failed: {exc}\nRaw: {raw_content[:300]}") from exc

    token_counts = dict(state.get("token_counts") or {})
    latencies_ms = dict(state.get("latencies_ms") or {})
    token_counts["agent_1"] = response.usage.input_tokens + response.usage.output_tokens
    latencies_ms["agent_1"] = elapsed_ms

    return {
        **state,
        "structured": structured,
        "token_counts": token_counts,
        "latencies_ms": latencies_ms,
    }
