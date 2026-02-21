from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# Rule Schemas
class RuleBase(BaseModel):
    description: str
    field: Optional[str] = None
    condition: Optional[str] = None
    severity: str = "Medium"
    is_active: bool = True

class RuleCreate(RuleBase):
    pass

class Rule(RuleBase):
    id: int
    policy_id: int

    class Config:
        from_attributes = True

# Policy Schemas
class PolicyBase(BaseModel):
    filename: str

class PolicyCreate(PolicyBase):
    extracted_text: Optional[str] = None

class Policy(PolicyBase):
    id: int
    uploaded_at: datetime
    rules: List[Rule] = []

    class Config:
        from_attributes = True

# Employee Schemas
class EmployeeBase(BaseModel):
    employee_id: str
    name: str
    department: Optional[str] = None
    role: Optional[str] = None
    working_days: int = 0
    target_sales: int = 0
    actual_sales: int = 0
    customer_satisfaction_score: int = 0
    policy_compliance: str = "Yes"
    low_working_days: bool = False
    target_not_met: bool = False
    low_customer_satisfaction: bool = False
    non_compliance_reason: Optional[str] = None
    month: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class EmployeeCreate(EmployeeBase):
    pass

class Employee(EmployeeBase):
    id: int

    class Config:
        from_attributes = True

# Violation Schemas
class ViolationBase(BaseModel):
    description: str
    severity: str = "Medium"

class ViolationCreate(ViolationBase):
    employee_id: int
    rule_id: int

class Violation(ViolationBase):
    id: int
    employee_id: int
    rule_id: int
    timestamp: datetime

    class Config:
        from_attributes = True
