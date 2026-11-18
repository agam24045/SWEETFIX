"""Apply the condition rules transcribed from SweetFix_Disease_Rules.pdf."""

import json
from pathlib import Path


RULES_FILE = Path(__file__).parent / "data" / "disease_rules.json"

# These two database entries are explicitly erythritol blends.
COMPONENT_IN_BLENDS = {"SW004": ("ING006", "ING007")}
NOTE_ACTIONS = ("LIMIT", "REVIEW", "CAUTION", "SOFT PENALTY", "NO AUTO BLOCK")
REMOVE_ACTIONS = ("BLOCK", "LIMIT", "REVIEW", "CAUTION", "SOFT PENALTY")


def load_disease_rules():
    with RULES_FILE.open(encoding="utf-8") as file:
        return json.load(file)


def screen_conditions(selected_conditions, sweeteners, rule_data=None):
    """Conservatively remove entries linked to selected conditions.

    NO AUTO BLOCK stays available unless another selected condition adds a
    removal rule. The PDF action is retained so this project policy is clear.
    """
    data = rule_data if rule_data is not None else load_disease_rules()
    selected = set(selected_conditions)
    unknown = selected - set(data["conditions"])
    if unknown:
        raise ValueError(f"Unknown condition: {', '.join(sorted(unknown))}")

    entries = {item["id"]: item for item in sweeteners}
    matches = {}
    for rule in data["rules"]:
        if rule["condition"] not in selected:
            continue
        ids = (rule["sweetener_id"], *COMPONENT_IN_BLENDS.get(rule["sweetener_id"], ()))
        for sweetener_id in ids:
            if sweetener_id in entries:
                matches.setdefault(sweetener_id, []).append(rule)

    blocked = []
    removed = []
    notes = {action: [] for action in NOTE_ACTIONS}
    for sweetener_id, item in entries.items():
        rules = matches.get(sweetener_id, [])
        actions = [action for action in REMOVE_ACTIONS if any(rule["action"] == action for rule in rules)]
        if actions:
            removed.append({
                "id": sweetener_id,
                "name": item["name"],
                "actions": actions,
                "conditions": list(dict.fromkeys(rule["condition"] for rule in rules if rule["action"] in REMOVE_ACTIONS)),
            })
        block_rules = [rule for rule in rules if rule["action"] == "BLOCK"]
        if block_rules:
            blocked.append({"id": sweetener_id, "name": item["name"], "conditions": [rule["condition"] for rule in block_rules]})
            continue
        for action in NOTE_ACTIONS:
            if action == "NO AUTO BLOCK" and actions:
                continue
            action_rules = [rule for rule in rules if rule["action"] == action]
            if action_rules:
                notes[action].append({
                    "id": sweetener_id,
                    "name": item["name"],
                    "conditions": [rule["condition"] for rule in action_rules],
                    "notes": [rule["note"] for rule in action_rules],
                })

    return {"blocked": blocked, "removed": removed, "notes": notes}


def remaining_candidates(sweeteners, heat_filtered, condition_screen):
    """Return database entries left after automatic exclusions, not recommendations."""
    excluded = {item["id"] for item in heat_filtered}
    excluded.update(item["id"] for item in condition_screen["removed"])
    return [item for item in sweeteners if item["id"] != "SW001" and item["id"] not in excluded]
