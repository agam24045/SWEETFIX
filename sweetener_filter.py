import json
import re
from pathlib import Path


DATABASE = Path(__file__).parent / "data" / "sweeteners.json"
HEAT_FINDINGS = Path(__file__).parent / "data" / "heat_findings.json"
UPPER_HEAT_BOUND = re.compile(r"<\s*(\d+(?:\.\d+)?)\s*°\s*C\b", re.I)


def maximum_stability_temperature(note):
    """Read only an explicit '< X °C' ceiling from the database field."""
    match = UPPER_HEAT_BOUND.search(note)
    return float(match.group(1)) if match else None


def load_sweeteners():
    with DATABASE.open(encoding="utf-8") as file:
        sweeteners = json.load(file)
    with HEAT_FINDINGS.open(encoding="utf-8") as file:
        findings = json.load(file)

    for item in sweeteners:
        research = findings.get(item["id"], {})
        item["exclude_when_heated"] = research.get("exclude_when_heated", False)
        item["max_stable_c"] = research.get("max_stable_c", maximum_stability_temperature(item["heat_stability"]))
        item["temperature_review_c"] = research.get("temperature_review_c")
        item["temperature_review_note"] = research.get("temperature_review_note", "")
    return sweeteners


def screen_sweeteners(heated, sweeteners=None, recipe_temperature_c=None):
    """Filter on qualitative heat loss or a genuine numeric stability maximum."""
    if not isinstance(heated, bool):
        raise ValueError("heated must be True or False")
    if not heated:
        return []
    entries = sweeteners if sweeteners is not None else load_sweeteners()
    filtered = []
    for item in entries:
        if item["id"] == "SW001":
            continue
        limit = item.get("max_stable_c")
        above_limit = recipe_temperature_c is not None and limit is not None and recipe_temperature_c > limit
        if item.get("exclude_when_heated") or above_limit:
            filtered.append({**item, "filter_reason": "temperature_limit" if above_limit else "heat_loss"})
    return filtered


def temperature_review_sweeteners(recipe_temperature_c, sweeteners=None):
    """Flag exceeded study conditions that are not valid hard stability limits."""
    if recipe_temperature_c is None:
        return []
    entries = sweeteners if sweeteners is not None else load_sweeteners()
    return [
        item for item in entries
        if item["id"] != "SW001"
        and item.get("temperature_review_c") is not None
        and recipe_temperature_c > item["temperature_review_c"]
    ]
