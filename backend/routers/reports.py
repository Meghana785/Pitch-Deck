from fastapi import APIRouter
from typing import List

router = APIRouter(prefix="/reports")

@router.get("")
def get_reports():
    # Stub: Return empty list to prevent frontend crashes
    return []

@router.get("/{id}")
def get_report(id: str):
    # Stub: Not implemented fully yet
    return {"id": id, "vertical": "logistics_saas", "assumption_map": [], "blind_spots": [], "sharpening": []}
