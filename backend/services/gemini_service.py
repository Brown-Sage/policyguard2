"""
gemini_service.py — AI Rule Extractor
======================================
Uses the Gemini API to parse policy PDF text into structured rules.
- temperature=0 for deterministic output
- Strict prompt constraining column names and value formats
- Called as Tier 1; regex extractor is the Tier 2 fallback
"""

import json
import os
from typing import List, Dict, Any

import google.genai as genai
from google.genai import types as genai_types


def _get_client():
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set.")
    return genai.Client(api_key=api_key)


async def generate_rules_from_text(
    text: str,
    csv_columns: List[str] | None = None,
) -> List[Dict[str, Any]]:
    """
    Send policy text to Gemini and return a list of structured rule dicts.

    Args:
        text:        Extracted text from the policy PDF.
        csv_columns: Optional list of actual CSV column headers from the uploaded
                     dataset. When provided, Gemini uses them directly instead of
                     guessing column names — solving the different-dataset problem.

    Returns:
        List of rule dicts: {description, field, condition, severity}
    """
    rules_text = ""

    # Build dynamic column hint for the prompt
    if csv_columns:
        col_hint = (
            "The employee dataset has EXACTLY these column headers (use them verbatim):\n"
            + ", ".join(f'"{c}"' for c in csv_columns)
            + "\n\nFor each rule, choose the most relevant column from the list above as "
            "'field'. DO NOT invent column names not in this list."
        )
    else:
        col_hint = (
            "Choose 'field' from: working_days, actual_sales, "
            "customer_satisfaction_score, policy_compliance."
        )

    prompt = f"""
You are a highly precise, deterministic compliance engine.
Extract every measurable compliance rule from the policy text below and return a
JSON array of rule objects. Each object MUST have exactly these keys:

- "description"  : Short restatement of the rule.
- "field"        : The exact dataset column this rule checks. {col_hint}
- "condition"    : A Python-evaluable string. Rules:
    • Numeric fields  → operators like ">= 25", "< 15", "== 5"
    • Sales vs target → ">= target_sales" or "< target_sales"  
    • Boolean/string compliance columns → ONLY "== 'Yes'" or "== 'No'"
      (the column contains the literal string 'Yes' or 'No', never True/False/'Compliant')
- "severity"     : One of "Low", "Medium", "High", "Critical" based on language cues
    • "critical", "termination", "zero tolerance" → Critical
    • "strict", "must", "required", "violation" → High
    • "expected", "should", "recommended" → Medium
    • "relaxed", "minor", "advisory" → Low

Return ONLY a valid JSON array. No markdown, no explanation.

Policy Text:
{text[:30000]}
"""

    try:
        client = _get_client()
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                temperature=0.0,
                top_p=0.1,
                top_k=1,
            ),
        )
        rules_text = response.text.strip()

        # Strip optional markdown fences
        if rules_text.startswith("```"):
            rules_text = rules_text.split("\n", 1)[-1]
        if rules_text.endswith("```"):
            rules_text = rules_text[:-3]

        rules = json.loads(rules_text)
        print(f"[gemini] Extracted {len(rules)} rules.")
        return rules

    except json.JSONDecodeError as e:
        print(f"[gemini] JSON parse error: {e}. Raw: {rules_text[:200]}")
        raise
    except Exception as e:
        print(f"[gemini] API error: {e}")
        raise
