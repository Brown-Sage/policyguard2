#!/bin/bash
source venv/bin/activate
export PYTHONPATH=.

python3 -c "
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from models.models import Rule, Policy, Base
from database import engine, AsyncSessionLocal

async def setup_test_rules():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as session:
        # Create a dummy policy
        policy = Policy(filename='test_policy.pdf', extracted_text='Dummy text')
        session.add(policy)
        await session.commit()
        await session.refresh(policy)
        
        # Create rules
        rules = [
            Rule(policy_id=policy.id, category='Working Hours', description='Minimum working days is 20 days per month.', parameters={'min_working_days': 20}),
            Rule(policy_id=policy.id, category='Sales', description='Sales target must be met.', parameters={}),
            Rule(policy_id=policy.id, category='Customer Success', description='Customer satisfaction score must be at least 3.', parameters={'min_csat': 3}),
            Rule(policy_id=policy.id, category='General', description='Employees must adhere to overall company policy compliance.', parameters={})
        ]
        session.add_all(rules)
        await session.commit()
        print('Test rules created successfully.')

asyncio.run(setup_test_rules())
"
