from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List

from database import get_db
from models.models import Employee, Rule, Violation, Policy
from schemas.schemas import Violation as ViolationSchema
from services.compliance_engine import evaluate_employees_against_rules

router = APIRouter(prefix="/api/scan", tags=["Scan"])

@router.post("/reset")
async def reset_system(db: AsyncSession = Depends(get_db)):
    """Wipes all data to start a fresh, isolated scan."""
    await db.execute(delete(Violation))
    await db.execute(delete(Rule))
    await db.execute(delete(Employee))
    await db.execute(delete(Policy))
    await db.commit()
    return {"message": "System reset."}

@router.post("/trigger", response_model=List[ViolationSchema])
async def trigger_scan(employee_id: int = None, db: AsyncSession = Depends(get_db)):
    """
    Triggers a batch compliance scan mapping extracted rules to dataset columns.
    """
    # 1. Fetch active rules
    rules_result = await db.execute(select(Rule).filter(Rule.is_active == True))
    active_rules = rules_result.scalars().all()
    
    if not active_rules:
        return []
        
    # 2. Fetch employees to scan
    employees_query = select(Employee)
    if employee_id:
        employees_query = employees_query.filter(Employee.id == employee_id)
        
    employees_result = await db.execute(employees_query)
    employees_to_scan = employees_result.scalars().all()
    
    if not employees_to_scan:
        return []
        
    # 3. Evaluate using the new batch engine
    new_violations = await evaluate_employees_against_rules(db, active_rules, employees_to_scan)
        
    if new_violations:
        await db.commit()
        for v in new_violations:
            await db.refresh(v)
            
    return new_violations
