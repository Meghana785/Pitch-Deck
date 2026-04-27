"""
PipelineState — shared TypedDict passed through every LangGraph node.

Inputs, agent outputs, and telemetry are all stored here so each
node can read prior results and append its own.
"""

from __future__ import annotations

from typing import TypedDict


class PipelineState(TypedDict):
    # ---- Inputs --------------------------------------------------------
    raw_text: str        # Extracted text from PDF / PPTX
    vertical: str        # e.g. 'logistics_saas'
    run_id: str
    user_id: str
    skeptic_level: str   # high, medium, supportive
    focus_area: str      # general, technical, financial, market

    # ---- Agent outputs -------------------------------------------------
    structured: dict     # Agent 1 — structured fields extracted from deck
    assumptions: list    # Agent 2 — list of assumption dicts
    hard_questions: list # Agent 3 — list of hard question dicts
    report: dict         # Agent 4 — final synthesised report dict

    # ---- Telemetry -----------------------------------------------------
    token_counts: dict   # { 'agent_1': int, 'agent_2': int, ... }
    latencies_ms: dict   # { 'agent_1': int, 'agent_2': int, ... }
