"""
Agent 4 — Report Synthesizer.

Combines the outputs of all three prior agents into a structured,
three-section pitch-readiness report in a single JSON payload.
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
You are a report writer synthesizing a pitch readiness assessment. \
Combine the inputs into a clean, structured report with exactly three sections.
Return only valid JSON in this exact shape:
{
  "assumption_map": [ { "assumption": str, "category": str, "risk_level": str, "why_unproven": str } ],
  "blind_spots": [ { "question": str, "why_it_matters": str, "what_good_looks_like": str } ],
  "sharpening_prompts": [
    { "action": str, "rationale": str, "priority": "high"|"medium"|"low" }
  ]
}
sharpening_prompts should be 5–8 specific, actionable next steps \
derived from the assumption map and blind spots.\
"""


async def run_report_synthesizer(state: PipelineState) -> PipelineState:
    """
    Agent 4: Synthesise a three-section pitch readiness report.

    Combines structured pitch, assumptions, and hard questions from
    prior agents into a final JSON report.
    Updates state['report'] with the parsed dict.
    Records token usage in state['token_counts']['agent_4'] and
    latency in state['latencies_ms']['agent_4'].
    """
    user_content = json.dumps(
        {
            "structured_pitch": state["structured"],
            "assumptions": state["assumptions"],
            "hard_questions": state["hard_questions"],
        },
        ensure_ascii=False,
    )

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
                messages=[{"role": "user", "content": user_content}],
            )
            break
        except anthropic.APIStatusError as exc:
            last_exc = exc
            logger.warning("report_synthesizer attempt %d failed: %s", attempt + 1, exc)
            if attempt < _RETRIES:
                await asyncio.sleep(_BACKOFF_S)
    else:
        raise RuntimeError(
            f"[report_synthesizer] API failed after {_RETRIES + 1} attempts: {last_exc}"
        )

    elapsed_ms = int((time.perf_counter() - start) * 1000)
    raw_content = response.content[0].text

    try:
        report = json.loads(raw_content)
        for required_key in ("assumption_map", "blind_spots", "sharpening_prompts"):
            if required_key not in report:
                raise ValueError(f"Missing required key: {required_key}")
    except (json.JSONDecodeError, ValueError) as exc:
        raise ValueError(
            f"[report_synthesizer] JSON parse failed: {exc}\nRaw: {raw_content[:300]}"
        ) from exc

    token_counts = dict(state.get("token_counts") or {})
    latencies_ms = dict(state.get("latencies_ms") or {})
    token_counts["agent_4"] = response.usage.input_tokens + response.usage.output_tokens
    latencies_ms["agent_4"] = elapsed_ms

    return {
        **state,
        "report": report,
        "token_counts": token_counts,
        "latencies_ms": latencies_ms,
    }
