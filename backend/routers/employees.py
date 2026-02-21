from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any

from database import get_db
from models.models import Employee
from schemas.schemas import Employee as EmployeeSchema, EmployeeCreate
from services.dataset_loader import load_dataset_from_csv

router = APIRouter(prefix="/api/employees", tags=["Employees"])

@router.post("/", response_model=EmployeeSchema)
async def create_employee(employee_in: EmployeeCreate, db: AsyncSession = Depends(get_db)):
    # Check if employee_id exists
    result = await db.execute(select(Employee).filter(Employee.employee_id == employee_in.employee_id))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee ID already exists.")
        
    new_employee = Employee(**employee_in.model_dump())
    db.add(new_employee)
    await db.commit()
    await db.refresh(new_employee)
    return new_employee

@router.post("/batch", response_model=Dict[str, Any])
async def batch_create_employees(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """
    Upload a CSV dataset of employees and import them.
    Returns a summary payload.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
        
    csv_bytes = await file.read()
    summary = await load_dataset_from_csv(csv_bytes, db)
    
    if "error" in summary:
        raise HTTPException(status_code=500, detail=summary["error"])
        
    return summary

@router.get("/", response_model=List[EmployeeSchema])
async def list_employees(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Employee))
    return result.scalars().all()
