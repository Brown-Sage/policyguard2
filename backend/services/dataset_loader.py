import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import io
from typing import Dict, Any

from models.models import Employee

async def load_dataset_from_csv(csv_bytes: bytes, db: AsyncSession) -> Dict[str, Any]:
    """
    Reads a CSV dataset from bytes, parses it using pandas, and inserts new records into the employees table.
    Returns a summary of the operation.
    """
    try:
        df = pd.read_csv(io.BytesIO(csv_bytes))
    except Exception as e:
        return {"error": f"Failed to parse CSV: {e}", "records_imported": 0, "duplicates_skipped": 0}

    # Normalize column names to match model fields exactly
    column_mapping = {
        'Employee_ID': 'employee_id',
        'Name': 'name',
        'Working_Days': 'working_days',
        'Target_Sales': 'target_sales',
        'Actual_Sales': 'actual_sales',
        'Customer_Satisfaction_Score': 'customer_satisfaction_score',
        'Policy_Compliance': 'policy_compliance',
        'Low_Working_Days': 'low_working_days',
        'Target_Not_Met': 'target_not_met',
        'Low_Customer_Satisfaction': 'low_customer_satisfaction',
        'Non_Compliance_Reason': 'non_compliance_reason',
        'Month': 'month'
    }
    
    # Check if expected columns exist before renaming to avoid warnings
    cols_to_rename = {k: v for k, v in column_mapping.items() if k in df.columns}
    df = df.rename(columns=cols_to_rename)
    
    # Handle NaN values explicitly
    df = df.fillna({
        'non_compliance_reason': '',
        'month': ''
    })
    
    # Convert booleans where pandas might have read them as strings ('True'/'False' or 'Yes'/'No')
    # Assuming the dataset contains actual booleans or "True"/"False" strings
    bool_cols = ['low_working_days', 'target_not_met', 'low_customer_satisfaction']
    for col in bool_cols:
        if col in df.columns:
            # Try to convert safely
            if df[col].dtype == object:
                df[col] = df[col].astype(str).str.lower().map({'true': True, 'false': False, 'yes': True, 'no': False})
            df[col] = df[col].fillna(False).astype(bool)
            
    # For actual_sales, customer_satisfaction_score, target_sales, working_days, ensure numerical
    num_cols = ['working_days', 'target_sales', 'actual_sales', 'customer_satisfaction_score']
    for col in num_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)

    # Convert the DataFrame to a list of dictionaries for batch insertion
    records = df.to_dict('records')
    
    records_imported = 0
    duplicates_skipped = 0
    
    # 1. Fetch current existing employee IDs to avoid duplicate insertions
    result = await db.execute(select(Employee.employee_id))
    existing_ids = set(result.scalars().all())
    
    new_employees = []
    
    for record in records:
        emp_id = str(record.get('employee_id', ''))
        
        if not emp_id:
            continue # Skip invalid rows without ID
            
        if emp_id in existing_ids:
            duplicates_skipped += 1
            print(f"Skipping duplicate employee: {emp_id}")
            continue
            
        # Ensure we only pass attributes that the model defines
        model_kwargs = {k: v for k, v in record.items() if hasattr(Employee, k)}
        
        # Default missing string fields
        if 'name' not in model_kwargs:
            model_kwargs['name'] = 'Unknown'
            
        new_emp = Employee(**model_kwargs)
        new_employees.append(new_emp)
        existing_ids.add(emp_id) # Prevent duplicates across batch rows
        
    if new_employees:
        db.add_all(new_employees)
        await db.commit()
        records_imported = len(new_employees)
        
    return {
        "records_imported": records_imported,
        "duplicates_skipped": duplicates_skipped,
        "total_processed": len(records)
    }
