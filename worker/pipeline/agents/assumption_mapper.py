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

import anthropic

from pipeline.state import PipelineState

logger = logging.getLogger(__name__)

_MODEL = "claude-sonnet-4-5"
_MAX_TOKENS = 1500
_RETRIES = 2
_BACKOFF_S = 2

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
    Agent 2: Map unproven / risky assumptions from the structured pitch.

    Updates state['assumptions'] with a parsed list.
    Records token usage in state['token_counts']['agent_2'] and
    latency in state['latencies_ms']['agent_2'].
    """
    client = anthropic.AsyncAnthropic()
    user_content = json.dumps(state["structured"], ensure_ascii=False)
    start = time.perf_counter()

    response = None
    last_exc: Exception | None = None

    for attempt in range(_RETRIES + 1):
        try:
            response = await client.messages.create(
                model=_MODEL,
                max_tokens=_MAX_TOKENS,
                system=_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_content}],
            )
            break
        except anthropic.APIStatusError as exc:
            last_exc = exc
            logger.warning("assumption_mapper attempt %d failed: %s", attempt + 1, exc)
            if attempt < _RETRIES:
                await asyncio.sleep(_BACKOFF_S)
    else:
        raise RuntimeError(
            f"[assumption_mapper] API failed after {_RETRIES + 1} attempts: {last_exc}"
        )

    elapsed_ms = int((time.perf_counter() - start) * 1000)
    raw_content = response.content[0].text

    try:
        assumptions = json.loads(raw_content)
        if not isinstance(assumptions, list):
            raise ValueError("Expected a JSON array")
    except (json.JSONDecodeError, ValueError) as exc:
        raise ValueError(
            f"[assumption_mapper] JSON parse failed: {exc}\nRaw: {raw_content[:300]}"
        ) from exc

    token_counts = dict(state.get("token_counts") or {})
    latencies_ms = dict(state.get("latencies_ms") or {})
    token_counts["agent_2"] = response.usage.input_tokens + response.usage.output_tokens
    latencies_ms["agent_2"] = elapsed_ms

    return {
        **state,
        "assumptions": assumptions,
        "token_counts": token_counts,
        "latencies_ms": latencies_ms,
    }
