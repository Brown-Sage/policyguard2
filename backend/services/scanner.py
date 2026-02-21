from models.models import Rule, Employee, Violation
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

async def scan_employee_for_violations(employee: Employee, rules: List[Rule], session: AsyncSession) -> List[Violation]:
    """
    Scans a single employee against active rules to find violations.
    This is a dummy implementation that explicitly checks for "Trading" max_trade_amount.
    In a real app, this matching logic would be dynamic and extensible.
    """
    violations_found = []
    
    # Example logic: Match employee.data with rule parameters
    # Expected employee.data format: {"recent_trades": [{"amount": 6000}]}
    
    for rule in rules:
        if not rule.is_active:
            continue
            
        if rule.category == "Trading" and rule.parameters:
            max_trade = rule.parameters.get("max_trade_amount")
            if max_trade is not None and employee.data and "recent_trades" in employee.data:
                for trade in employee.data["recent_trades"]:
                    if trade.get("amount", 0) > max_trade:
                        v = Violation(
                            employee_id=employee.id,
                            rule_id=rule.id,
                            details=f"Trade amount {trade.get('amount')} exceeds limit of {max_trade} set in rule {rule.id}",
                            status="Open"
                        )
                        violations_found.append(v)
                        # We only record one violation per rule per scan run for an employee for simplicity
                        break

    if violations_found:
        session.add_all(violations_found)
        # Commit might be handled by caller, but we can flush or commit here if needed
        # Better to let the route handler perform the commit so it's a single transaction
        
    return violations_found
