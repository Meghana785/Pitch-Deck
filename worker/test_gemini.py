import asyncio
import os
import sys
from dotenv import load_dotenv

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

# Ensure worker is in the path
sys.path.insert(0, os.path.abspath("."))

from pipeline.agents.extractor import run_extractor
from pipeline.state import PipelineState

async def run_test():
    state = PipelineState(
        raw_text="PitchReady is an AI startup that automates technical due diligence for VCs. We are raising $2M seed. We have 10k MRR.",
        vertical="AI SaaS",
        run_id="test",
        user_id="test",
        structured={},
        assumptions=[],
        hard_questions=[],
        report={},
        token_counts={},
        latencies_ms={}
    )
    
    print("Testing Gemini Extractor Agent...")
    try:
        result = await run_extractor(state)
        print("Gemini Response extracted successfully!")
        import json
        print(json.dumps(result["structured"], indent=2))
        print("Tokens Used:", result["token_counts"])
    except Exception as e:
        print(f"Error testing Gemini: {e}")

if __name__ == "__main__":
    asyncio.run(run_test())
