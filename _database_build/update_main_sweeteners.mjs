import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const runtimeRequire = createRequire(path.join(process.env.CODEX_NODE_MODULES, "package.json"));
const { Workbook, SpreadsheetFile } = runtimeRequire("@oai/artifact-tool");

const buildDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.dirname(buildDir);
const sourcePath = path.join(buildDir, "selected_data.json");
const updatePath = path.join(buildDir, "sweetener_research_updates.json");
const workbookPath = path.join(projectDir, "submission", "SweetFix_Final_Sweetener_Database.xlsx");
const notesPath = path.join(projectDir, "submission", "SweetFix_Sweetener_Research_Notes.md");

const data = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const research = JSON.parse(await fs.readFile(updatePath, "utf8"));
const columns = new Map(data.headers.map((header, index) => [header, index]));
const byId = new Map(data.rows.map((row) => [row[0], row]));
if (data.headers.length !== 21 || data.rows.length !== 94 || research.updates.length !== 77) {
  throw new Error("Unexpected database dimensions or number of reviewed changes");
}

for (const update of research.updates) {
  const row = byId.get(update.id);
  const column = columns.get(update.field);
  if (!row || column === undefined || update.id.startsWith("OS")) {
    throw new Error(`Invalid research update: ${update.id} ${update.field}`);
  }
  row[column] = update.value;
}

// Derived figures retain the source measurement and state the calculation.
const calculations = [];
const fieldIndex = (name) => columns.get(name);
function appendCalculation(id, field, expectedInput, result, formula, displayInput = expectedInput) {
  const row = byId.get(id);
  const index = fieldIndex(field);
  const current = String(row[index]);
  if (!current.includes(expectedInput)) throw new Error(`Calculation input changed: ${id} ${field}`);
  if (!current.includes("CALC —")) row[index] = `${current}; CALC — ${result}`;
  calculations.push({ id, field, input: displayInput, result, formula });
}
const round = (number, places = 1) => Number(number.toFixed(places)).toString();

// The existing small-molecule entries use 342.3 × i / molecular weight.
// This is an ideal dilute-solution comparison per equal dissolved mass.
let checkedFreezingFactors = 0;
for (const row of data.rows) {
  if (!row[0].startsWith("SW") && !row[0].startsWith("ING")) continue;
  const match = String(row[fieldIndex("Freezing_Point_Effect")]).match(/([\d.]+) × sucrose per dissolved g; ideal i=(\d+)/);
  if (!match || typeof row[fieldIndex("Molecular_Weight_g_mol")] !== "number") continue;
  const calculated = 342.3 * Number(match[2]) / row[fieldIndex("Molecular_Weight_g_mol")];
  if (Math.abs(calculated - Number(match[1])) > 0.002) throw new Error(`Incorrect freezing factor: ${row[0]}`);
  checkedFreezingFactors += 1;
}
if (checkedFreezingFactors !== 56) throw new Error("Unexpected count of existing freezing calculations");

for (const id of ["SW058", "SW059", "SW062", "SW064"]) {
  const row = byId.get(id);
  const mass = row[fieldIndex("Molecular_Weight_g_mol")];
  if (typeof mass !== "number") throw new Error(`Missing protein molecular mass: ${id}`);
  const factor = round(342.3 / mass, 5);
  const result = `${factor} × sucrose per equal dissolved g for an intact stated-mass unit (i=1); aggregation or dissociation may change this`;
  const current = String(row[fieldIndex("Freezing_Point_Effect")]);
  if (current.startsWith("SPEC —") || current.startsWith(`CALC — ${factor} × sucrose per equal dissolved g`))
    row[fieldIndex("Freezing_Point_Effect")] = `CALC — ${result}`;
  else if (current !== `CALC — ${result}`) throw new Error(`Unexpected protein freezing value: ${id}`);
  calculations.push({ id, field: "Freezing_Point_Effect", input: `${mass} g/mol`, result, formula: `342.3 / ${mass}` });
}

let absoluteFreezingCount = 0;
for (const row of data.rows) {
  if (!row[0].startsWith("SW") && !row[0].startsWith("ING")) continue;
  const mass = row[fieldIndex("Molecular_Weight_g_mol")];
  const current = String(row[fieldIndex("Freezing_Point_Effect")]);
  const ordinary = current.match(/([\d.]+) × sucrose per dissolved g; ideal i=(\d+)/);
  const protein = current.match(/([\d.]+) × sucrose per equal dissolved g for an intact stated-mass unit \(i=1\)/);
  if (typeof mass !== "number" || (!ordinary && !protein)) continue;
  const particleFactor = ordinary ? Number(ordinary[2]) : 1;
  const drop = (1.86 * particleFactor / mass).toFixed(6);
  const result = `ideal ΔTf≈${drop}°C at 1 g dissolved solute/kg water`;
  if (!current.includes("ideal ΔTf≈")) row[fieldIndex("Freezing_Point_Effect")] = `${current}; ${result}`;
  calculations.push({ id: row[0], field: "Freezing_Point_Effect", input: `${mass} g/mol; i=${particleFactor}; 1 g/kg water`, result,
    formula: `1.86 × ${particleFactor} / ${mass}` });
  absoluteFreezingCount += 1;
}
if (absoluteFreezingCount !== 60) throw new Error("Unexpected count of absolute freezing calculations");

// Convert the source's cooling numbers to J/g without changing its sign convention.
const coolingInputs = [
  ["SW001", -4.3, "kcal/kg"], ["SW003", -42.3, "kJ/kg"],
  ["SW004", -43, "kcal/kg"], ["SW005", -36.5, "kcal/kg"],
  ["SW006", -26, "kcal/kg"], ["SW007", -28.5, "kcal/kg"],
  ["SW008", -18.9, "kcal/kg"], ["SW009", -13.9, "kcal/kg"],
  ["SW010", -9.4, "kcal/kg"],
  ["SW011", 20.34, "kJ/mol", 378.33], // trehalose dihydrate
  ["SW013", 9.95, "kJ/mol", 180.16],
  ["SW014", 11.01, "kJ/mol", 180.16],
  ["SW015", 9.71, "kJ/mol", 360.31], // maltose monohydrate
  ["SW017", 17.11, "kJ/mol", 180.16],
];
for (const [id, value, unit, molarMass] of coolingInputs) {
  const converted = unit === "kcal/kg" ? value * 4.184
    : unit === "kJ/kg" ? value : value * 1000 / molarMass;
  const formula = unit === "kcal/kg" ? `${value} × 4.184`
    : unit === "kJ/kg" ? `${value} kJ/kg = ${value} J/g`
    : `${value} × 1000 / ${molarMass}`;
  const sourceNumber = `${value > 0 ? "+" : ""}${value}${unit === "kJ/mol" ? "" : ` ${unit}`}`;
  appendCalculation(id, "Cooling_Effect_Heat_of_Solution", sourceNumber,
    `${round(converted)} J/g (source sign retained)`, formula,
    `${value > 0 ? "+" : ""}${value} ${unit}`);
}

// Convert explicit solubility units. Values remain tied to their stated test conditions.
for (const [id, percent] of [
  ["SW001", 67], ["SW004", 37], ["SW005", 64], ["SW006", 71],
  ["SW007", 18], ["SW008", 60], ["SW009", 58], ["SW010", 28],
]) {
  appendCalculation(id, "Solubility", `${percent} % w/w`,
    `${round(1000 * percent / (100 - percent))} g solute/kg water (assuming % of saturated solution)`,
    `1000 × ${percent} / (100 − ${percent})`);
}
for (const [id, amount] of [
  ["SW002", 324.2], ["SW003", 160], ["SW011", 68.9], ["SW021", 28.3],
  ["SW034", 0.1],
]) {
  appendCalculation(id, "Solubility", `${amount} g/100 mL`,
    `${round(amount * 10)} g/L water`, `${amount} × 10`);
}
appendCalculation("SW017", "Solubility", "47.25 g/100 g water",
  "472.5 g/kg water", "47.25 × 10");
appendCalculation("SW015", "Solubility", "780000 mg/L",
  "780 g/L water", "780000 / 1000");
appendCalculation("SW025", "Solubility", "1 g in about 7.5 mL water",
  "~133.3 g/L water (test temperature unspecified)", "1000 / 7.5");

const sweeteners = data.rows.filter((row) => row[0].startsWith("SW") || row[0].startsWith("ING"));
if (sweeteners.length !== 72) throw new Error("Expected 72 main sweetener records");
const workbook = Workbook.create();
const sheet = workbook.worksheets.add("Sweeteners");
const lastRow = sweeteners.length + 1;
const widths = [15, 34, 26, 24, 19, 15, 19, 18, 48, 56, 56, 56, 50, 52, 52, 40, 44, 52, 45, 45, 48];
const letters = "ABCDEFGHIJKLMNOPQRSTU";
sheet.showGridLines = false;
const all = sheet.getRange(`A1:U${lastRow}`);
all.values = [data.headers, ...sweeteners];
all.format.font = { name: "Arial", size: 10, color: "#1F2937" };
all.format.verticalAlignment = "center";
all.format.wrapText = true;
for (let index = 0; index < widths.length; index += 1) {
  sheet.getRange(`${letters[index]}1:${letters[index]}${lastRow}`).format.columnWidth = widths[index];
}
const header = sheet.getRange("A1:U1");
header.format = {
  fill: "#23384D",
  font: { name: "Arial", size: 10, bold: true, color: "#FFFFFF" },
  verticalAlignment: "center",
  horizontalAlignment: "center",
  wrapText: true,
};
header.format.rowHeight = 44;
sheet.getRange(`A2:U${lastRow}`).format.autofitRows();
const table = sheet.tables.add(`A1:U${lastRow}`, true, "SweetFixSweeteners");
table.showFilterButton = true;
sheet.freezePanes.freezeRows(1);

workbook.recalculate();
const inspected = await workbook.inspect({
  kind: "table", range: "Sweeteners!A1:E4", include: "values",
  tableMaxRows: 4, tableMaxCols: 5, maxChars: 1500,
});
console.log(inspected.ndjson);
const preview = await workbook.render({ sheetName: "Sweeteners", range: "A1:F7", scale: 1, format: "png" });
await fs.writeFile(path.join(buildDir, "SweetFixSweeteners_researched.png"), new Uint8Array(await preview.arrayBuffer()));
const calculatedPreview = await workbook.render({ sheetName: "Sweeteners", range: "J1:O7", scale: 1, format: "png" });
await fs.writeFile(path.join(buildDir, "SweetFixSweeteners_calculated.png"), new Uint8Array(await calculatedPreview.arrayBuffer()));
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(workbookPath);
await fs.writeFile(sourcePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

const lines = [
  "# SweetFix main sweetener database: source record",
  "",
  "Historical review of the earlier 72-record workbook. The current submission has 65 SW records and additional functional-property columns. See `SweetFix_Functional_Properties_Research.md` for current scope and sources.",
  "",
  `Reviewed ${research.review_date}. Scope: ${research.scope}.`,
  "",
  "The workbook has one sheet, 72 SW/ING records, and the 21 approved parameters. The links below document the values added or revised in this review; pre-existing values need a separate source audit. A number in a physical-property field applies only to the stated temperature, form, concentration, pH, and test method. ADIs are jurisdiction-specific; ‘not specified’ does not mean unlimited intake.",
  "",
  "| ID | Parameter | Reviewed value | Source(s) |",
  "| --- | --- | --- | --- |",
  ...research.updates.map((item) => {
    const sources = [item.source, item.source2, item.source3].filter(Boolean).map((url, index) => `[${index + 1}](${url})`).join(", ");
    return `| ${item.id} | ${item.field} | ${item.value.replaceAll("|", "\\|")} | ${sources} |`;
  }),
  "",
  "## Remaining limits",
  "",
  "The following fields still have `NR` entries after this review:",
  "",
  "| Parameter | `NR` records |",
  "| --- | ---: |",
  ...data.headers.map((field, index) => [field, sweeteners.filter((row) => String(row[index]).startsWith("NR")).length])
    .filter(([, count]) => count > 0)
    .map(([field, count]) => `| ${field} | ${count} |`),
  "",
  "- `NR` means a value was not verified for the exact entity and measurement conditions. It is not zero.",
  "- `SPEC` marks a formulation or condition-dependent value; commercial extracts and blends do not have one molecular formula, melting point, or fixed sweetness without a product specification.",
  "- Cooling effect and heat stability are not single universal temperatures. Dissolution heat depends on crystal form and solvent; heat stability depends on time, pH, moisture, and the food matrix.",
  "- FDA and EFSA ADIs can differ. Keep the jurisdiction label when using a value. No ADI is assigned to a sweetener merely because a search did not find one.",
  "",
  "The remaining `NR` fields cannot be calculated uniquely from the other columns: sweetness requires sensory comparison; solubility, dissolution heat, melting point and glass transition require the stated solid form and measurement conditions; heat stability requires time, pH and matrix; experimental fermentability requires an organism and protocol; calories require metabolic evidence; glycemic index requires a standardized human response test; and an ADI requires a toxicology assessment by the relevant authority.",
  "",
  "## Calculated values",
  "",
  `I checked ${checkedFreezingFactors} existing ideal freezing-point ratios against 342.3 × i / molecular weight and calculated ${absoluteFreezingCount} ideal freezing-point drops at 1 g dissolved solute per kg water. The following additional values or unit conversions were calculated. Original unreviewed inputs still need source verification; a converted number does not validate its input.`,
  "",
  "| ID | Parameter | Input | Calculated result | Calculation |",
  "| --- | --- | --- | --- | --- |",
  ...calculations.map(({ id, field, input, result, formula }) =>
    `| ${id} | ${field} | ${input} | ${result} | ${formula} |`),
  "",
  "The freezing-point ratios assume a dilute, ideal aqueous solution and an intact dissolved particle. Protein aggregation, dissociation and food matrices can change the result. Cooling conversions retain each source's sign convention; the signs were not harmonized across studies. Percent-by-weight solubility conversions assume the percentage is solute mass divided by saturated-solution mass.",
  "",
  "Calculation reference: [OpenStax colligative properties](https://openstax.org/books/chemistry-atoms-first-2e/pages/11-4-colligative-properties).",
  "",
];
await fs.writeFile(notesPath, lines.join("\n"), "utf8");
console.log("SAVED", workbookPath, "records", sweeteners.length, "updates", research.updates.length);

// Rebuild the current 65-record functional submission after this historical review.
await import("./build_functional_65.mjs");
