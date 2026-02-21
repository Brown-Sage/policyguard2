"""
compliance_engine.py — Schema-Driven, Type-Aware Violation Engine
================================================================

Architecture
------------
1. COLUMN SCHEMA   : defines the type and allowed comparison operators for each dataset column.
2. RULE NORMALIZER : after the AI generates a condition, it is validated and rewritten
                     so the comparison always matches the actual column type in the database.
                     This eliminates AI hallucinations such as `== True`, `== 'Compliant'`.
3. TYPED EVALUATOR : performs the final comparison using direct Python operator functions.
                     No eval(), no Pandas query strings, no string-vs-boolean confusion.
4. BATCH WRITER    : collects violations and bulk-inserts them in a single transaction.
"""

import re
import operator
from typing import List, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from models.models import Employee, Rule, Violation


# ─── 1. COLUMN SCHEMA ──────────────────────────────────────────────────────────

class ColumnType:
    INT    = "int"      # whole numbers  (working_days, customer_satisfaction_score)
    FLOAT  = "float"    # decimals
    STRING = "string"   # exact string match  (policy_compliance → 'Yes'/'No')
    REF    = "ref"      # compare against another column  (actual_sales vs target_sales)


# Maps every known dataset column to its type and legal comparison operators.
COLUMN_SCHEMA: dict = {
    "working_days":                  {"type": ColumnType.INT,    "ops": ["<", "<=", ">", ">=", "==", "!="]},
    "target_sales":                  {"type": ColumnType.INT,    "ops": ["<", "<=", ">", ">=", "==", "!="]},
    "actual_sales":                  {"type": ColumnType.REF,    "ops": ["<", "<=", ">", ">=", "==", "!="],
                                      "ref_col": "target_sales"},
    "customer_satisfaction_score":   {"type": ColumnType.FLOAT,  "ops": ["<", "<=", ">", ">=", "==", "!="]},
    "policy_compliance":             {"type": ColumnType.STRING,  "ops": ["==", "!="],
                                      "allowed_values": ["Yes", "No"]},
    "low_working_days":              {"type": ColumnType.STRING,  "ops": ["=="],
                                      "allowed_values": ["True", "False"]},
    "target_not_met":                {"type": ColumnType.STRING,  "ops": ["=="],
                                      "allowed_values": ["True", "False"]},
    "low_customer_satisfaction":     {"type": ColumnType.STRING,  "ops": ["=="],
                                      "allowed_values": ["True", "False"]},
}

# Operator functions
OPS = {
    "<":  operator.lt,
    "<=": operator.le,
    ">":  operator.gt,
    ">=": operator.ge,
    "==": operator.eq,
    "!=": operator.ne,
}


# ─── 2. RULE NORMALIZER ────────────────────────────────────────────────────────

def _extract_op_and_value(condition: str) -> Optional[tuple]:
    """
    Parse a condition string like '>= 25', '== 5', "== 'Yes'", '>= target_sales'.
    Returns (operator_str, raw_value_str) or None if it can't be parsed.
    """
    condition = condition.strip()
    for op in ["<=", ">=", "!=", "==", "<", ">"]:
        if condition.startswith(op):
            val = condition[len(op):].strip().strip("'\"")
            return op, val
    return None


def normalize_rule(rule: Rule) -> Optional[dict]:
    """
    Validate and normalize one Rule against the schema.
    Returns a dict:  {field, op, typed_value, ref_col}
    Returns None if the rule cannot be evaluated safely.
    """
    field = (rule.field or "").strip()
    condition = (rule.condition or "").strip()

    if field not in COLUMN_SCHEMA:
        return None
    if not condition:
        return None

    schema = COLUMN_SCHEMA[field]
    parsed = _extract_op_and_value(condition)
    if not parsed:
        return None

    op_str, raw_val = parsed

    if op_str not in schema["ops"]:
        return None

    col_type = schema["type"]

    # ── STRING type (e.g. policy_compliance) ──────────────────────────────────
    if col_type == ColumnType.STRING:
        # Normalise: map any truthy alias → allowed value
        allowed = schema.get("allowed_values", [])
        if field == "policy_compliance":
            # Positive-compliance aliases → 'Yes'
            if raw_val.lower() in {"yes", "true", "compliant", "1", "comply", "adhered"}:
                typed_val = "Yes"
            elif raw_val.lower() in {"no", "false", "0", "non-compliant", "not compliant"}:
                typed_val = "No"
            else:
                typed_val = raw_val  # pass through and let comparison fail gracefully
        else:
            typed_val = raw_val
        return {"field": field, "op": op_str, "typed_value": typed_val,
                "ref_col": None, "col_type": col_type}

    # ── REF type (e.g. actual_sales vs target_sales) ──────────────────────────
    if col_type == ColumnType.REF:
        ref_col = schema.get("ref_col", "")
        # Accept any variant the AI might use for the reference column name
        if raw_val.lower() in {ref_col, ref_col.lower(), ref_col.replace("_", " "), "target"}:
            return {"field": field, "op": op_str, "typed_value": None,
                    "ref_col": ref_col, "col_type": col_type}
        # Maybe AI gave a literal number instead of a column reference
        try:
            typed_val = float(raw_val)
            return {"field": field, "op": op_str, "typed_value": typed_val,
                    "ref_col": None, "col_type": ColumnType.FLOAT}
        except ValueError:
            return None

    # ── NUMERIC types ──────────────────────────────────────────────────────────
    try:
        if col_type == ColumnType.INT:
            typed_val = int(float(raw_val))
        else:
            typed_val = float(raw_val)
    except ValueError:
        return None

    return {"field": field, "op": op_str, "typed_value": typed_val,
            "ref_col": None, "col_type": col_type}


# ─── 3. TYPED EVALUATOR ────────────────────────────────────────────────────────

def is_violating(emp: Employee, norm: dict) -> Optional[str]:
    """
    Check whether one employee violates one normalised rule.
    Returns a human-readable violation description or None if compliant.
    """
    field    = norm["field"]
    op_str   = norm["op"]
    typed_val = norm["typed_value"]
    ref_col  = norm["ref_col"]
    col_type = norm["col_type"]
    op_fn    = OPS[op_str]

    actual = getattr(emp, field, None)
    if actual is None:
        return None  # column missing on this employee record

    # ── REF comparison ────────────────────────────────────────────────────────
    if col_type == ColumnType.REF and ref_col:
        ref_val = getattr(emp, ref_col, None)
        if ref_val is None:
            return None
        try:
            a = float(actual)
            r = float(ref_val)
        except (TypeError, ValueError):
            return None
        compliant = op_fn(a, r)
        if not compliant:
            return (f"{field} ({actual}) is not {op_str} {ref_col} ({ref_val})")
        return None

    # ── STRING comparison ──────────────────────────────────────────────────────
    if col_type == ColumnType.STRING:
        actual_str = str(actual).strip()
        compliant  = op_fn(actual_str, str(typed_val))
        if not compliant:
            return (f"{field} is '{actual_str}', must be {op_str} '{typed_val}'")
        return None

    # ── NUMERIC comparison ─────────────────────────────────────────────────────
    try:
        if col_type == ColumnType.INT:
            a = int(float(actual))
        else:
            a = float(actual)
    except (TypeError, ValueError):
        return None

    compliant = op_fn(a, typed_val)
    if not compliant:
        return (f"{field} ({a}) is not {op_str} {typed_val}")
    return None


# ─── 4. MAIN ENGINE ────────────────────────────────────────────────────────────

async def evaluate_employees_against_rules(
    db: AsyncSession,
    rules: List[Rule],
    employees: List[Employee]
) -> List[Violation]:
    """
    Evaluate every employee against every active rule using the typed schema.
    Skips rules that cannot be safely normalised (bad AI output).
    """
    if not rules or not employees:
        return []

    active_rules = [r for r in rules if r.is_active]
    if not active_rules:
        return []

    # Fetch existing (employee_id, rule_id) pairs to avoid duplicates
    result = await db.execute(select(Violation.employee_id, Violation.rule_id))
    existing_pairs: set = set(result.all())

    new_violations: List[Violation] = []

    # Pre-normalise rules once — skipping any the AI output incorrectly
    normalised: list = []
    for rule in active_rules:
        norm = normalize_rule(rule)
        if norm is None:
            print(f"[engine] Skipping rule id={rule.id} field='{rule.field}' "
                  f"condition='{rule.condition}' — could not be normalised.")
        else:
            print(f"[engine] Rule id={rule.id}: {rule.field} {norm['op']} "
                  f"{norm['typed_value'] if norm['ref_col'] is None else norm['ref_col']}")
            normalised.append((rule, norm))

    print(f"[engine] Evaluating {len(employees)} employees against "
          f"{len(normalised)}/{len(active_rules)} valid rules …")

    for emp in employees:
        for rule, norm in normalised:
            pair = (emp.id, rule.id)
            if pair in existing_pairs:
                continue

            description = is_violating(emp, norm)
            if description is not None:
                v = Violation(
                    employee_id=emp.id,
                    rule_id=rule.id,
                    description=description,
                    severity=rule.severity or "Medium",
                    timestamp=datetime.utcnow(),
                )
                new_violations.append(v)
                existing_pairs.add(pair)

    if new_violations:
        db.add_all(new_violations)

    print(f"[engine] Found {len(new_violations)} new violations.")
    return new_violations
