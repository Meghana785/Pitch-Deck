"""
LangGraph DAG for the PitchReady AI pipeline.

Topology: extractor → mapper → interrogator → synthesizer → END

Each node is wrapped in an error-handling shim that catches any exception,
logs it with the node name, and re-raises with the node name embedded in
the message so callers can report which step failed.
"""

from __future__ import annotations

import logging
from typing import Callable, Awaitable

from langgraph.graph import END, StateGraph

from pipeline.state import PipelineState
from pipeline.agents.extractor import run_extractor
from pipeline.agents.assumption_mapper import run_assumption_mapper
from pipeline.agents.domain_interrogator import run_domain_interrogator
from pipeline.agents.report_synthesizer import run_report_synthesizer

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Error-handling wrapper
# ---------------------------------------------------------------------------

def _wrap(
    node_name: str,
    fn: Callable[[PipelineState], Awaitable[PipelineState]],
) -> Callable[[PipelineState], Awaitable[PipelineState]]:
    """
    Return an async wrapper around *fn* that:
    - Logs entry and exit for the node
    - Catches any exception, logs it with *node_name*, and re-raises a
      new RuntimeError that includes the node name in the message.
    """
    async def _wrapped(state: PipelineState) -> PipelineState:
        logger.info("[%s] starting", node_name)
        try:
            result = await fn(state)
            logger.info("[%s] completed", node_name)
            return result
        except Exception as exc:
            logger.exception("[%s] failed: %s", node_name, exc)
            raise RuntimeError(f"[{node_name}] {exc}") from exc

    _wrapped.__name__ = node_name
    return _wrapped


# ---------------------------------------------------------------------------
# Graph construction
# ---------------------------------------------------------------------------

def _build_graph() -> StateGraph:
    """Construct and return the compiled LangGraph StateGraph."""
    graph = StateGraph(PipelineState)

    graph.add_node("extractor",    _wrap("extractor",    run_extractor))
    graph.add_node("mapper",       _wrap("mapper",       run_assumption_mapper))
    graph.add_node("interrogator", _wrap("interrogator", run_domain_interrogator))
    graph.add_node("synthesizer",  _wrap("synthesizer",  run_report_synthesizer))

    graph.set_entry_point("extractor")

    graph.add_edge("extractor",    "mapper")
    graph.add_edge("mapper",       "interrogator")
    graph.add_edge("interrogator", "synthesizer")
    graph.add_edge("synthesizer",  END)

    return graph


# ---------------------------------------------------------------------------
# Exported compiled pipeline
# ---------------------------------------------------------------------------

_graph = _build_graph()

#: Compiled LangGraph pipeline — call `await pipeline.ainvoke(state)` to run.
pipeline = _graph.compile()
