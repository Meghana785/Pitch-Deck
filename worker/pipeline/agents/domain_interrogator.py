"""
Agent 3 — Domain Interrogator.

Acts as a senior domain-expert investor for the given vertical.
Loads a vertical-specific knowledge base from disk (falls back to a
generic stub when the vertical file is not found) and generates
exactly 8 hard questions the founder has not adequately addressed.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time

import google.generativeai as genai
import os

from pipeline.state import PipelineState

logger = logging.getLogger(__name__)

_MODEL_NAME = "gemini-flash-latest"
_MAX_TOKENS = 2048

# Where vertical KB markdown files live (relative to this repo's worker dir)
_VERTICALS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "verticals")

_GENERIC_KB = """\
This is a generic startup domain. Key considerations for any vertical:
- Customer acquisition costs vs lifetime value
- Competitive moat and defensibility
- Go-to-market efficiency
- Unit economics at scale
- Team execution capability
- Regulatory and compliance risks
- Market timing and readiness
"""

_SYSTEM_PROMPT_TEMPLATE = """\
You are a senior investor and domain expert in {vertical}. \
You have reviewed hundreds of pitches in this space.
You have deep knowledge of the competitive landscape, buyer behavior, \
common failure modes, and what separates successful from failed companies.

DOMAIN KNOWLEDGE:
{vertical_kb_content}

Given this startup pitch and its assumption gaps, generate the 8 hardest \
questions this founder has NOT adequately addressed — questions that any \
serious domain-expert investor would immediately ask.

For each question output:
{{ "question": str, "why_it_matters": str, "what_good_looks_like": str }}
Return a JSON array of exactly 8 objects.\
"""


def _load_vertical_kb(vertical: str) -> str:
    """Load the vertical KB markdown file; return generic fallback if absent."""
    path = os.path.join(_VERTICALS_DIR, f"{vertical}.md")
    try:
        with open(path, encoding="utf-8") as fh:
            content = fh.read().strip()
        if content:
            return content
    except FileNotFoundError:
        logger.warning("Vertical KB not found for '%s', using generic fallback.", vertical)
    return _GENERIC_KB


async def run_domain_interrogator(state: PipelineState) -> PipelineState:
    """
    Agent 3: Generate 8 hard domain-expert investor questions using Gemini.
    """
    vertical = state["vertical"]
    vertical_kb = _load_vertical_kb(vertical)

    system_prompt = _SYSTEM_PROMPT_TEMPLATE.format(
        vertical=vertical,
        vertical_kb_content=vertical_kb,
    )

    user_content = json.dumps(
        {
            "structured_pitch": state["structured"],
            "assumption_gaps": state["assumptions"],
        },
        ensure_ascii=False,
    )

    genai.configure(api_key=os.environ["GEMINI_API"])
    model = genai.GenerativeModel(
        model_name=_MODEL_NAME,
        system_instruction=system_prompt
    )
    
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
        logger.error("[domain_interrogator] Gemini API failed: %s", exc)
        raise RuntimeError(f"[domain_interrogator] Gemini API failed: {exc}")

    elapsed_ms = int((time.perf_counter() - start) * 1000)
    raw_content = response.text

    try:
        hard_questions = json.loads(raw_content)
        if not isinstance(hard_questions, list):
            raise ValueError("Expected a JSON array")
    except (json.JSONDecodeError, ValueError) as exc:
        raise ValueError(
            f"[domain_interrogator] JSON parse failed: {exc}\nRaw: {raw_content[:300]}"
        ) from exc

    token_counts = dict(state.get("token_counts") or {})
    latencies_ms = dict(state.get("latencies_ms") or {})
    
    usage = response.usage_metadata
    token_counts["agent_3"] = usage.total_token_count
    latencies_ms["agent_3"] = elapsed_ms

    return {
        **state,
        "hard_questions": hard_questions,
        "token_counts": token_counts,
        "latencies_ms": latencies_ms,
    }
