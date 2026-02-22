import secrets
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List

from database import get_db
from models.models import Employee, Rule, Violation, Policy, ScanLog
from schemas.schemas import Violation as ViolationSchema
from services.compliance_engine import evaluate_employees_against_rules

router = APIRouter(prefix="/api/scan", tags=["Scan"])

@router.post("/reset")
async def reset_system(db: AsyncSession = Depends(get_db)):
    """Wipes employee/rule/violation/policy data for a fresh, isolated scan.
    Scan logs are intentionally preserved so history survives across resets."""
    await db.execute(delete(Violation))
    await db.execute(delete(Rule))
    await db.execute(delete(Employee))
    await db.execute(delete(Policy))
    await db.commit()
    return {"message": "System reset."}

@router.post("/trigger", response_model=List[ViolationSchema])
async def trigger_scan(employee_id: int = None, db: AsyncSession = Depends(get_db)):
    """Triggers a batch compliance scan and saves a persistent ScanLog entry."""
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

    # 3. Evaluate
    new_violations = await evaluate_employees_against_rules(db, active_rules, employees_to_scan)

    if new_violations:
        await db.commit()
        for v in new_violations:
            await db.refresh(v)

    # 4. Count total violations in DB for this scan
    total_violations_result = await db.execute(select(Violation))
    total_violations = len(total_violations_result.scalars().all())

    # 5. Fetch policy filename for the log
    policy_result = await db.execute(select(Policy).order_by(Policy.id.desc()).limit(1))
    latest_policy = policy_result.scalars().first()
    policy_filename = latest_policy.filename if latest_policy else "Unknown Policy"

    # 6. Save ScanLog (preserve across resets)
    log = ScanLog(
        scan_id=secrets.token_hex(4),           # short 8-char hex like '4bb07fc9'
        policy_filename=policy_filename,
        dataset_filename="Policy_Compliance_Dataset_Updated.csv",
        violation_count=total_violations,
        employee_count=len(employees_to_scan),
    )
    db.add(log)
    await db.commit()

    return new_violations

@router.get("/logs")
async def get_scan_logs(db: AsyncSession = Depends(get_db)):
    """Returns all historical scan logs ordered newest-first."""
    result = await db.execute(
        select(ScanLog).order_by(ScanLog.scanned_at.desc())
    )
    logs = result.scalars().all()
    return [
        {
            "id":               log.id,
            "scan_id":          log.scan_id,
            "policy_filename":  log.policy_filename,
            "dataset_filename": log.dataset_filename,
            "violation_count":  log.violation_count,
            "employee_count":   log.employee_count,
            "scanned_at":       log.scanned_at.strftime("%H:%M") if log.scanned_at else "",
            "scanned_at_full":  log.scanned_at.isoformat() if log.scanned_at else "",
        }
        for log in logs
    ]
