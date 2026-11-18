"""Export original sugar-source research from the workbook for the live demo.

Run after editing the workbook: python export_original_research.py
This maintenance script needs openpyxl. The live demo only reads JSON.
"""

import json
from pathlib import Path

from openpyxl import load_workbook


DATA = Path(__file__).parent / "data"
EXPANDED = DATA / "SweetFix_Database_Expanded.xlsx"
WORKBOOK = EXPANDED if EXPANDED.exists() else DATA / "SweetFix_Database_Final.xlsx"
CATALOG = DATA / "original_sweeteners.json"
OUTPUT = DATA / "original_sweetener_research.json"


def sheet_records(sheet):
    rows = sheet.values
    headings = next(rows)
    for row in rows:
        if row and row[0]:
            yield dict(zip(headings, row))


def export():
    with CATALOG.open(encoding="utf-8") as file:
        catalog = json.load(file)
    names = {item["id"]: item["name"] for item in catalog}

    workbook = load_workbook(WORKBOOK, read_only=True, data_only=True)
    parameters = {
        row["Sweetener_ID"]: row
        for row in sheet_records(workbook["Sweeteners_Parameters"])
        if str(row["Sweetener_ID"]).startswith("OS")
    }
    if set(names) != set(parameters):
        raise ValueError("Original-source IDs differ between the catalog and workbook")

    evidence = {}
    for row in sheet_records(workbook["Evidence_Log"]):
        source_id = row["Sweetener_ID"]
        if source_id in names:
            evidence.setdefault(source_id, []).append(row)

    source_links = {
        row["Source_ID"]: {"citation": row["Citation"], "url": row["URL"]}
        for row in sheet_records(workbook["Sources"])
    }

    numeric_examples = {source_id: [] for source_id in names}
    if "OS_Numeric_Values" in workbook:
        for item in sheet_records(workbook["OS_Numeric_Values"]):
            source_id = item["OS_ID"]
            if source_id not in numeric_examples:
                raise ValueError(f"Unknown numeric-example ID: {source_id}")
            if not isinstance(item["Value"], (int, float)):
                raise ValueError(f"Non-numeric example for {source_id}")
            if item["Source_ID"] not in source_links:
                raise ValueError(f"Unknown numeric-example source: {item['Source_ID']}")
            numeric_examples[source_id].append({
                "product": item["Specific product or grade"],
                "parameter": item["Parameter"],
                "value": item["Value"],
                "unit": item["Unit"],
                "conditions": item["Basis and conditions"],
                "source_id": item["Source_ID"],
                "interpretation": item["Interpretation"],
            })

    records = {}
    for source_id, name in names.items():
        row = parameters[source_id]
        if row["Name"] != name:
            raise ValueError(f"Name differs for {source_id}: {row['Name']}")
        properties = []
        for item in evidence.get(source_id, []):
            parameter = item["Parameter"]
            properties.append({
                "parameter": parameter,
                "value": row[parameter],
                "status": item["Evidence_status"],
                "source_ids": item["Source_IDs"],
                "note": item["Conditions_and_evidence_notes"],
            })
        if len(properties) != 21:
            raise ValueError(f"Expected 21 researched properties for {source_id}")
        records[source_id] = {
            "name": name,
            "origin": row["Origin"],
            "identity": row["Identity_Source"],
            "disease_restriction_flag": row["Disease_Restriction_Flag"],
            "regulatory_status": row["Regulatory_Status"],
            "properties": properties,
            "numeric_examples": numeric_examples[source_id],
        }

    payload = {"records": records, "sources": source_links}
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Exported {len(records)} original sugar sources to {OUTPUT}")


if __name__ == "__main__":
    export()
