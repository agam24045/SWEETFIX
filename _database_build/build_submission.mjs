import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const runtimeRequire = createRequire(path.join(process.env.CODEX_NODE_MODULES, "package.json"));
const { Workbook, SpreadsheetFile } = runtimeRequire("@oai/artifact-tool");

const workDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.dirname(workDir);
const submissionDir = path.join(projectDir, "submission");
const extracted = JSON.parse(await fs.readFile(path.join(workDir, "selected_data.json"), "utf8"));
const { headers, rows } = extracted;

if (headers.length !== 21 || rows.length !== 94) {
  throw new Error("Unexpected source dimensions");
}

const outputs = [
  {
    file: "SweetFix_Final_Sweetener_Database.xlsx",
    sheet: "Sweeteners",
    table: "SweetFixSweeteners",
    rows: rows.filter((row) => row[0].startsWith("SW") || row[0].startsWith("ING")),
  },
  {
    file: "SweetFix_Natural_Sweeteners.xlsx",
    sheet: "Natural sweeteners",
    table: "SweetFixNatural",
    rows: rows.filter((row) => row[0].startsWith("OS")),
  },
];

const widths = [15, 34, 26, 24, 19, 15, 19, 18, 48, 56, 56, 56, 50, 52, 52, 40, 44, 52, 45, 45, 48];
const letters = "ABCDEFGHIJKLMNOPQRSTU";
await fs.mkdir(submissionDir, { recursive: true });

for (const output of outputs) {
  const workbook = Workbook.create();
  const sheet = workbook.worksheets.add(output.sheet);
  sheet.showGridLines = false;
  const lastRow = output.rows.length + 1;
  const all = sheet.getRange(`A1:U${lastRow}`);
  all.values = [headers, ...output.rows];
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
  const table = sheet.tables.add(`A1:U${lastRow}`, true, output.table);
  table.showFilterButton = true;
  sheet.freezePanes.freezeRows(1);

  workbook.recalculate();
  const check = await workbook.inspect({
    kind: "table",
    range: `${output.sheet}!A1:E4`,
    include: "values",
    tableMaxRows: 4,
    tableMaxCols: 5,
    maxChars: 1500,
  });
  console.log(output.file, check.ndjson);
  const preview = await workbook.render({ sheetName: output.sheet, range: "A1:F7", scale: 1, format: "png" });
  await fs.writeFile(path.join(workDir, `${output.table}.png`), new Uint8Array(await preview.arrayBuffer()));
  const xlsx = await SpreadsheetFile.exportXlsx(workbook);
  const target = path.join(submissionDir, output.file);
  await xlsx.save(target);
  console.log("SAVED", target, "records", output.rows.length);
}

// The current main submission keeps SW001–SW065 and functional properties.
await import("./build_functional_65.mjs");
