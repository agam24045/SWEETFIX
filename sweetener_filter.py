import json
from pathlib import Path


DATABASE = Path(__file__).parent / "data" / "sweeteners.json"
HEAT_FINDINGS = Path(__file__).parent / "data" / "heat_findings.json"


def load_sweeteners():
    with DATABASE.open(encoding="utf-8") as file:
        sweeteners = json.load(file)
    with HEAT_FINDINGS.open(encoding="utf-8") as file:
        findings = json.load(file)

    for item in sweeteners:
        research = findings.get(item["id"], {})
        item["research_level"] = research.get("level", "no_new_match")
        item["research_note"] = research.get(
            "finding",
            "No additional substance-specific time-temperature evidence was located in this research pass.",
        )
        item["research_sources"] = research.get("sources", [])
        item["review_when_heated"] = research.get("review_when_heated", False)
        item["exclude_when_baked"] = research.get("exclude_when_baked", False)
    return sweeteners


def screen_sweeteners(heat, sweeteners=None):
    """Group database entries by the available heat evidence, not by final suitability."""
    if heat not in {"baking", "hot", "none", "unknown"}:
        raise ValueError(f"Unknown heat setting: {heat}")

    results = {"excluded": [], "review": [], "candidate": [], "unscreened": []}
    for item in sweeteners if sweeteners is not None else load_sweeteners():
        entry = dict(item)
        sweetener_id = entry["id"]
        heat_note = entry["heat_stability"].casefold()

        if sweetener_id == "SW001":
            group = "excluded"
            reason = "Sucrose is the reference sugar, not a replacement sweetener."
        elif heat == "none":
            group = "unscreened"
            reason = "No heating is expected; heat stability does not filter this entry."
        elif heat == "unknown":
            group = "review"
            reason = "Sweetener temperature exposure is unknown."
        elif (
            heat == "baking"
            and "not heat stable" in heat_note
            and "prolonged heating" in heat_note
        ):
            group = "excluded"
            reason = "Database reports loss of sweetness during prolonged heating."
        elif heat == "baking" and entry.get("exclude_when_baked"):
            group = "excluded"
            reason = "Published heating evidence shows loss of sweetness during baking-level heat."
        elif entry.get("review_when_heated"):
            group = "review"
            reason = "New heat-loss measurements need a matched process before this can pass."
        elif "heat stable; suitable for baking and hot processing" in heat_note:
            group = "candidate"
            reason = "Database describes this sweetener as stable for baking and hot processing."
        else:
            group = "review"
            reason = "No matched time, temperature, and food-matrix evidence for this process."

        entry["reason"] = reason
        results[group].append(entry)

    return results
