from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    extracted_text = Column(Text, nullable=True)

    rules = relationship("Rule", back_populates="policy", cascade="all, delete-orphan")

class Rule(Base):
    __tablename__ = "rules"

    id = Column(Integer, primary_key=True, index=True)
    policy_id = Column(Integer, ForeignKey("policies.id"))
    description = Column(Text)
    field = Column(String, nullable=True)     # Which employee field this rule checks
    condition = Column(String, nullable=True) # The condition (e.g., '< 20', '== False')
    severity = Column(String, default="Medium")
    is_active = Column(Boolean, default=True)

    policy = relationship("Policy", back_populates="rules")
    violations = relationship("Violation", back_populates="rule")

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, unique=True, index=True)
    name = Column(String)
    department = Column(String, nullable=True)
    role = Column(String, nullable=True)
    working_days = Column(Integer, default=0)
    target_sales = Column(Integer, default=0)
    actual_sales = Column(Integer, default=0)
    customer_satisfaction_score = Column(Integer, default=0)
    policy_compliance = Column(String, default="Yes")
    low_working_days = Column(Boolean, default=False)
    target_not_met = Column(Boolean, default=False)
    low_customer_satisfaction = Column(Boolean, default=False)
    non_compliance_reason = Column(String, nullable=True)
    month = Column(String, nullable=True)
    
    data = Column(JSON, nullable=True) 

    violations = relationship("Violation", back_populates="employee")

class Violation(Base):
    __tablename__ = "violations"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    rule_id = Column(Integer, ForeignKey("rules.id"))
    description = Column(Text) # Renamed from details
    severity = Column(String, default="Medium") 
    timestamp = Column(DateTime, default=datetime.utcnow) # Renamed from detected_at

    employee = relationship("Employee", back_populates="violations")
    rule = relationship("Rule", back_populates="violations")

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, unique=True, index=True, nullable=False)
    username        = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at      = Column(DateTime, default=datetime.utcnow)

class ScanLog(Base):
    __tablename__ = "scan_logs"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, nullable=True, index=True)  # FK to users.id
    scan_id         = Column(String, index=True)
    policy_filename = Column(String, nullable=True)
    dataset_filename= Column(String, nullable=True)
    violation_count = Column(Integer, default=0)
    employee_count  = Column(Integer, default=0)
    scanned_at      = Column(DateTime, default=datetime.utcnow)

