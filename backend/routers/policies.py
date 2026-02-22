from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database import get_db
from models.models import Policy, Rule
from schemas.schemas import Policy as PolicySchema
from services.pdf_extractor import extract_text_from_pdf
from services.regex_rule_extractor import extract_rules_from_text as regex_extract
from services.gemini_service import generate_rules_from_text as gemini_extract

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

    # 3. Two-Tier Rule Extraction:
    #    Tier 1 — Gemini AI (richer NLP, column-aware when CSV headers provided)
    #    Tier 2 — Regex fallback (deterministic, always works, no API needed)
    extracted_rules = regex_extract(extracted_text)  # pre-compute fallback
    print(f"[policies] Regex fallback: {len(extracted_rules)} rules")

    try:
        ai_rules = await gemini_extract(extracted_text)
        if ai_rules:
            extracted_rules = ai_rules
            print(f"[policies] Gemini extracted {len(ai_rules)} rules (Tier 1 used).")
    except Exception as e:
        print(f"[policies] Gemini unavailable ({type(e).__name__}: {e}), using regex fallback.")

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
