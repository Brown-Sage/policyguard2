from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database import get_db
from models.models import Policy, Rule
from schemas.schemas import Policy as PolicySchema
from services.pdf_extractor import extract_text_from_pdf
from services.regex_rule_extractor import extract_rules_from_text

router = APIRouter(prefix="/api/policies", tags=["Policies"])

@router.post("/upload", response_model=PolicySchema)
async def upload_policy(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    pdf_bytes = await file.read()

    # 1. Extract text from PDF
    extracted_text = extract_text_from_pdf(pdf_bytes)
    if not extracted_text:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

    # 2. Save Policy to DB
    new_policy = Policy(filename=file.filename, extracted_text=extracted_text)
    db.add(new_policy)
    await db.commit()
    await db.refresh(new_policy)

    # 3. Extract rules deterministically from the PDF text
    extracted_rules = extract_rules_from_text(extracted_text)
    print(f"[policies] Extracted {len(extracted_rules)} rules: "
          f"{[r['field'] + ' ' + r['condition'] for r in extracted_rules]}")

    # 4. Save Rules to DB
    created_rules = []
    for r in extracted_rules:
        rule = Rule(
            policy_id=new_policy.id,
            field=r.get("field"),
            description=r.get("description", ""),
            condition=r.get("condition"),
            severity=r.get("severity", "Medium")
        )
        db.add(rule)
        created_rules.append(rule)

    if created_rules:
        await db.commit()

    return {
        "id": new_policy.id,
        "filename": new_policy.filename,
        "uploaded_at": new_policy.uploaded_at,
        "rules": created_rules
    }

@router.get("/", response_model=List[PolicySchema])
async def list_policies(db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Policy).options(selectinload(Policy.rules)).order_by(Policy.uploaded_at.desc())
    )
    return result.scalars().all()
