"""Read the workbook research exported for original sugar ingredients."""

import json
from functools import lru_cache
from pathlib import Path


RESEARCH = Path(__file__).parent / "data" / "original_sweetener_research.json"


@lru_cache(maxsize=1)
def load_original_research():
    with RESEARCH.open(encoding="utf-8") as file:
        return json.load(file)


def property_for(source_id, parameter):
    record = load_original_research()["records"].get(source_id)
    if record is None:
        return None
    return next((item for item in record["properties"] if item["parameter"] == parameter), None)
