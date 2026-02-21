"""
regex_rule_extractor.py — Deterministic Rule Extractor
=======================================================
Parses policy PDF text using regex patterns to extract numeric thresholds
and compliance conditions without any AI or external API dependency.
"""

import re
from typing import List, Dict, Any, Optional


# Maps identifying keywords to their schema field
FIELD_KEYWORDS = {
    "working_days":                 ["working days", "days per month", "days/month", "attendance days"],
    "customer_satisfaction_score":  ["customer satisfaction", "csat", "satisfaction score",
                                     "satisfaction rating", "satisfaction"],
    "actual_sales":                 ["sales target", "target sales", "actual sales",
                                     "sales must", "meet.*target", "exceed.*target"],
    "policy_compliance":            ["policy compliance", "must adhere", "adhere to",
                                     "company policy", "compliance policy"],
}


def _strip_list_prefix(sentence: str) -> str:
    """Remove leading list number like '1.' or '2.' from a sentence."""
    return re.sub(r'^\d+\.\s*', '', sentence.strip())


def _detect_field(sentence: str) -> Optional[str]:
    """Identify which database column a policy sentence refers to."""
    lower = _strip_list_prefix(sentence).lower()
    # Use ordered priority so more-specific fields win
    for field in ["working_days", "actual_sales", "customer_satisfaction_score", "policy_compliance"]:
        for kw in FIELD_KEYWORDS[field]:
            if re.search(kw, lower):
                return field
    return None


def _detect_operator(sentence: str) -> str:
    """Detect the comparison intent from natural language cues."""
    lower = _strip_list_prefix(sentence).lower()
    if any(w in lower for w in ["perfect", "exactly", "must be exactly", "precisely"]):
        return "=="
    if any(w in lower for w in ["at least", "minimum", "no less", "or more", "or above",
                                 "or exceeded", "met or exceed", "must be met",
                                 "or higher", "relaxed to", "days per month"]):
        return ">="
    if any(w in lower for w in ["at most", "no more than", "or less", "or below", "maximum"]):
        return "<="
    return ">="  # default: lower bound (most common)


def _extract_threshold(sentence: str) -> Optional[float]:
    """
    Extract the relevant numeric threshold from a sentence.
    Strips leading list numbers and then finds all numbers, returning
    the largest one (thresholds are almost always the biggest number in the sentence).
    """
    clean = _strip_list_prefix(sentence)
    # Find all numbers (including decimals)
    numbers = re.findall(r'\b(\d+(?:\.\d+)?)\b', clean)
    if not numbers:
        return None
    # Return the largest number found — this avoids picking up ordinal list prefixes
    # which are typically small (1, 2, 3, 4) vs actual thresholds (15, 25, 4, 5).
    return max(float(n) for n in numbers)


def extract_rules_from_text(text: str) -> List[Dict[str, Any]]:
    """
    Parse policy text and return structured rule dicts ready for DB insertion.
    """
    # Split on newlines and on sentence boundaries after numbered list items
    sentences = re.split(r'\n|(?<=\.)\s+(?=\d+\.)', text.strip())

    rules: List[Dict[str, Any]] = []
    seen_fields: set = set()  # one rule per field

    for raw_sentence in sentences:
        sentence = raw_sentence.strip()
        if len(sentence) < 8:
            continue

        field = _detect_field(sentence)
        if field is None or field in seen_fields:
            continue

        # ── policy_compliance ──────────────────────────────────────────────
        if field == "policy_compliance":
            rules.append({
                "description": _strip_list_prefix(sentence),
                "field":       "policy_compliance",
                "condition":   "== 'Yes'",
                "severity":    "Critical",
            })
            seen_fields.add(field)
            continue

        # ── actual_sales vs target_sales ───────────────────────────────────
        if field == "actual_sales":
            lower = sentence.lower()
            op = "==" if any(w in lower for w in ["exact", "exactly"]) else ">="
            rules.append({
                "description": _strip_list_prefix(sentence),
                "field":       "actual_sales",
                "condition":   f"{op} target_sales",
                "severity":    "High",
            })
            seen_fields.add(field)
            continue

        # ── numeric fields ─────────────────────────────────────────────────
        threshold = _extract_threshold(sentence)
        if threshold is None:
            continue

        op = _detect_operator(sentence)

        severity_map = {
            "working_days":                "High",
            "customer_satisfaction_score": "Critical" if op == "==" else "High",
        }
        severity = severity_map.get(field, "High")

        # Store as int if whole number
        value = int(threshold) if threshold.is_integer() else threshold

        rules.append({
            "description": _strip_list_prefix(sentence),
            "field":       field,
            "condition":   f"{op} {value}",
            "severity":    severity,
        })
        seen_fields.add(field)

    return rules
