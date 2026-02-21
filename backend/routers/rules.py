from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database import get_db
from models.models import Rule
from schemas.schemas import Rule as RuleSchema

router = APIRouter(prefix="/api/rules", tags=["Rules"])

@router.get("/", response_model=List[RuleSchema])
async def list_rules(policy_id: int = None, active_only: bool = True, db: AsyncSession = Depends(get_db)):
    query = select(Rule)
    if policy_id:
        query = query.filter(Rule.policy_id == policy_id)
    if active_only:
        query = query.filter(Rule.is_active == True)
        
    result = await db.execute(query)
    return result.scalars().all()
