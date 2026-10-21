import json
from pathlib import Path


DATABASE = Path(__file__).parent / "data" / "sweeteners.json"


def load_sweeteners():
    with DATABASE.open(encoding="utf-8") as file:
        return json.load(file)


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
        elif "heat stable; suitable for baking and hot processing" in heat_note:
            group = "candidate"
            reason = "Database describes this sweetener as stable for baking and hot processing."
        else:
            group = "review"
            reason = "No matched time, temperature, and food-matrix evidence for this process."

        entry["reason"] = reason
        results[group].append(entry)

    return results
