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
    
    reports_cursor = db.reports.find({"user_id": user_id}).sort("created_at", -1)
    reports = await reports_cursor.to_list(length=100)
    
    # Convert _id to id for API response
    for report in reports:
        report["id"] = report.pop("_id")
        
    return reports

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
