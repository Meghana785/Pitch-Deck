import asyncio
from worker.pipeline.agents.extractor import extract_company_info
from worker.pipeline.state import PipelineState

async def test_gemini():
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
        result = await extract_company_info(state)
        print("Gemini Response extracted successfully!")
        print(result)
    except Exception as e:
        print(f"Error testing Gemini: {e}")

if __name__ == "__main__":
    asyncio.run(test_gemini())
