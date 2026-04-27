import asyncio
from typing import Any
from fastapi import APIRouter, HTTPException, Request, Depends

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("")
async def get_reports(request: Request) -> list[dict[str, Any]]:
    """Get all reports for the authenticated user."""
    user_state = getattr(request.state, "user", None)
    if not user_state:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    db = request.app.state.db
    user_id = user_state["user_id"]
    
    # 1. Fetch all analysis runs for the user
    runs_cursor = db.analysis_runs.find({"user_id": user_id}).sort("created_at", -1)
    runs = await runs_cursor.to_list(length=100)
    
    # 2. For 'done' runs, we need to find the corresponding report_id
    # We'll do this in a batch to be efficient
    run_ids = [run["_id"] for run in runs if run.get("status") == "done"]
    reports_map = {}
    if run_ids:
        reports_cursor = db.reports.find({"run_id": {"$in": run_ids}}, {"_id": 1, "run_id": 1})
        async for report in reports_cursor:
            reports_map[report["run_id"]] = report["_id"]

    # 3. Format for frontend
    # frontend expects: { id (report_id), vertical, status, created_at, run_id }
    results = []
    for run in runs:
        results.append({
            "id": reports_map.get(run["_id"]), # This will be the report ID if done
            "run_id": run["_id"],
            "status": run.get("status", "queued"),
            "vertical": run.get("vertical", "auto"),
            "created_at": run.get("created_at")
        })
        
    return results

@router.get("/{id}")
async def get_report(request: Request, id: str) -> dict[str, Any]:
    """Get a specific report by ID."""
    user_state = getattr(request.state, "user", None)
    if not user_state:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    db = request.app.state.db
    user_id = user_state["user_id"]
    
    report = await db.reports.find_one({"_id": id})
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    if report["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this report")
        
    # Convert _id to id for API response
    report["id"] = report.pop("_id")
    
    return report

@router.delete("/{id}")
async def delete_report(request: Request, id: str):
    """
    Delete a specific report and its associated analysis run.
    The ID passed here is the run_id (the primary key for the history item).
    """
    user_state = getattr(request.state, "user", None)
    if not user_state:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    db = request.app.state.db
    user_id = user_state["user_id"]
    
    # 1. Find the run and verify ownership
    run = await db.analysis_runs.find_one({"_id": id})
    if not run:
        raise HTTPException(status_code=404, detail="Analysis run not found")
        
    if run["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this record")
        
    # 2. Delete the run and the report in parallel
    await asyncio.gather(
        db.analysis_runs.delete_one({"_id": id}),
        db.reports.delete_one({"run_id": id})
    )
    
    return {"message": "Record deleted successfully"}
