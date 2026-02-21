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

# Ordered severity keyword tiers — first match wins
SEVERITY_KEYWORDS = [
    ("Critical", [
        "critical", "immediate termination", "grounds for dismissal", "zero tolerance",
        "non-negotiable", "absolute", "mandatory", "no exceptions", "will result in termination",
        "severely", "gross misconduct", "unacceptable",
    ]),
    ("High", [
        "strict", "strictly", "must be met", "required", "violation", "breach",
        "will be penalised", "penalized", "disciplinary", "formal warning",
        "important", "significant", "essential", "compulsory",
    ]),
    ("Medium", [
        "expected", "should", "recommended", "encouraged", "standard",
        "preferable", "normally", "generally",
    ]),
    ("Low", [
        "relaxed", "flexible", "minor", "advisory", "guideline", "suggestion",
        "preferred", "ideally", "note", "informational",
    ]),
]


def _strip_list_prefix(sentence: str) -> str:
    """Remove leading list number like '1.' or '2.' from a sentence."""
    return re.sub(r'^\d+\.\s*', '', sentence.strip())


def _detect_field(sentence: str) -> Optional[str]:
    """Identify which database column a policy sentence refers to."""
    lower = _strip_list_prefix(sentence).lower()
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
    return ">="  # default: lower bound


def _detect_severity(sentence: str, field: str, op: str) -> str:
    """
    Determine severity by scanning the sentence for explicit severity language first.
    Falls back to field + operator heuristics if no keyword matches.

    Priority:
      1. Explicit keywords in the sentence (e.g. "critical breach", "strict", "relaxed")
      2. Field-type + operator heuristics as a sensible default
    """
    lower = _strip_list_prefix(sentence).lower()

    # 1. Keyword scan
    for severity, keywords in SEVERITY_KEYWORDS:
        for kw in keywords:
            if kw in lower:
                return severity

    # 2. Heuristic fallback
    if field == "policy_compliance":
        return "Critical"
    if field == "customer_satisfaction_score":
        return "Critical" if op == "==" else "High"
    if field == "actual_sales":
        return "High"
    # working_days — default
    return "High"


def _extract_threshold(sentence: str) -> Optional[float]:
    """
    Extract the numeric threshold from a sentence.
    Uses max() to avoid picking up ordinal list prefixes (1., 2., 3.).
    """
    clean = _strip_list_prefix(sentence)
    numbers = re.findall(r'\b(\d+(?:\.\d+)?)\b', clean)
    if not numbers:
        return None
    return max(float(n) for n in numbers)


def extract_rules_from_text(text: str) -> List[Dict[str, Any]]:
    """
    Parse policy text and return structured rule dicts ready for DB insertion.
    """
    sentences = re.split(r'\n|(?<=\.)\s+(?=\d+\.)', text.strip())

    rules: List[Dict[str, Any]] = []
    seen_fields: set = set()

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
                "severity":    _detect_severity(sentence, field, "=="),
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
                "severity":    _detect_severity(sentence, field, op),
            })
            seen_fields.add(field)
            continue

        # ── numeric fields ─────────────────────────────────────────────────
        threshold = _extract_threshold(sentence)
        if threshold is None:
            continue

        op = _detect_operator(sentence)
        value = int(threshold) if threshold.is_integer() else threshold

        rules.append({
            "description": _strip_list_prefix(sentence),
            "field":       field,
            "condition":   f"{op} {value}",
            "severity":    _detect_severity(sentence, field, op),
        })
        seen_fields.add(field)

    return rules
