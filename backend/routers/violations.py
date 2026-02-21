from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database import get_db
from models.models import Violation
from schemas.schemas import Violation as ViolationSchema

router = APIRouter(prefix="/api/violations", tags=["Violations"])

@router.get("/", response_model=List[ViolationSchema])
async def list_violations(employee_id: int = None, db: AsyncSession = Depends(get_db)):
    query = select(Violation).order_by(Violation.timestamp.desc())
    if employee_id:
        query = query.filter(Violation.employee_id == employee_id)
        
    result = await db.execute(query)
    return result.scalars().all()
