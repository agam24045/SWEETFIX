import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { solubilityAudit } from "./solubility_audit.mjs";

const runtimeRequire = createRequire(path.join(process.env.CODEX_NODE_MODULES, "package.json"));
const { Workbook, SpreadsheetFile } = runtimeRequire("@oai/artifact-tool");
const buildDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.dirname(buildDir);
const outputPath = path.join(projectDir, "submission", "SweetFix_Final_Sweetener_Database.xlsx");
const notesPath = path.join(projectDir, "submission", "SweetFix_Functional_Properties_Research.md");
const solubilityAuditPath = path.join(projectDir, "submission", "SweetFix_Solubility_Audit_65.md");
const source = JSON.parse(await fs.readFile(path.join(buildDir, "selected_data.json"), "utf8"));
const heatFindings = JSON.parse(await fs.readFile(path.join(projectDir, "data", "heat_findings.json"), "utf8"));
const oldHeaders = source.headers;
const originalRows = source.rows.filter(row => /^SW\d{3}$/.test(row[0]));
if (oldHeaders.length !== 21 || originalRows.length !== 65 || originalRows[0][0] !== "SW001" || originalRows.at(-1)[0] !== "SW065") {
  throw new Error("Expected SW001–SW065 and the 21-column source layout");
}
const oldIndex = new Map(oldHeaders.map((header, index) => [header, index]));
const rows = originalRows.map(row => [...row]);
const byId = new Map(rows.map(row => [row[0], row]));
const evidence = new Map(rows.map(row => [row[0], new Set()]));
const refs = {
  candy: "https://electronicsandbooks.com/edt/manual/Magazine/I/International%20Journal%20of%20Pharmaceutics/2004%20v.278/02%20%28209-484%29/447-457.pdf",
  biscuits: "https://pmc.ncbi.nlm.nih.gov/articles/PMC13256550/",
  cake: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10533539/",
  rareSugar: "https://pubs.acs.org/doi/10.1021/acsfoodscitech.5c01202",
  moisture: "https://researchmgt.monash.edu/ws/portalfiles/portal/419168805/395773575_oa.pdf",
  fsaIsomaltulose: "https://www.foodstandards.gov.au/sites/default/files/food-standards-code/applications/Documents/DAR_A578_Isomaltulose.pdf",
  efsaSteviol: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7448073/",
  rebM: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3907853/",
  steviolbioside: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5305715/",
  monk: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7008860/",
  siamenoside: "https://ijpsr.com/bft-article/stability-of-monk-fruit-sweetener-siamenoside-i-under-acidic-and-thermal-conditions-and-its-degradation-products/?view=fulltext",
  aceAsp: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3671041/",
  sucralose: "https://onlinelibrary.wiley.com/doi/10.2903/j.efsa.2026.9854",
  saccharin: "https://efsa.onlinelibrary.wiley.com/doi/full/10.2903/j.efsa.2024.9044",
  neotame: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12231243/",
  advantame: "https://www.fsc.go.jp/english/evaluationreports/foodadditive/advantame_report.pdf",
  alitame: "https://pubchem.ncbi.nlm.nih.gov/compound/Alitame",
  nhdc: "https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2022.7595",
  hernandulcin: "https://patents.google.com/patent/US4808409A/en",
  thaumatin: "https://academic.oup.com/bbb/article-pdf/65/2/409/35022693/bbb0409.pdf",
  thaumatinII: "https://onlinelibrary.wiley.com/doi/pdfdirect/10.1111/j.1432-1033.1973.tb02872.x",
  brazzein: "https://patents.google.com/patent/US5527555A",
  curculin: "https://pubmed.ncbi.nlm.nih.gov/7583017/",
  miraculin: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8193528/",
  monoNeoculin: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4444330/",
  fdaTrehalose: "https://www.fda.gov/media/140635/download",
  steviolFamily: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8826121/",
  polyolCrystals: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10995941/",
  isomaltMoisture: "https://www.sciencedirect.com/science/article/pii/S0032591021006707",
  lactitolMoisture: "https://patents.google.com/patent/US5516763A/en",
};
function record(id, ref) { evidence.get(id).add(ref); }
function setExisting(id, field, value, ref, onlyIfMissing = true) {
  const row = byId.get(id);
  const col = oldIndex.get(field);
  if (!row || col === undefined) throw new Error(`Unknown target ${id} ${field}`);
  if (!onlyIfMissing || String(row[col]).startsWith("NR")) row[col] = value;
  if (ref) record(id, ref);
}

// Experimental and authority-reviewed updates. These do not turn a class proxy
// into a compound-specific degradation temperature.
setExisting("SW026", "Heat_Stability", "REPORTED — dry material stable at room temperature; solution degrades at elevated temperature or low pH; no fixed cooking limit", refs.alitame);
for (const n of [29, 30, 31, 32, 33, 35, 36, 37, 38]) {
  const id = `SW${String(n).padStart(3, "0")}`;
  setExisting(id, "Heat_Stability", "CLASS PROXY — EFSA extends normal-processing stability evidence to minor steviol glycosides; pH 2 plus heat can degrade the group; compound-specific limit NR", refs.efsaSteviol);
}
setExisting("SW064", "Heat_Stability", "MEASURED — thaumatin I/II conformational change reversible at pH 5 up to 75°C; irreversible heat denaturation and sweetness loss depend on pH", refs.thaumatinII);
setExisting("SW065", "Heat_Stability", "MEASURED — miracle-berry preparation lost taste-modifying activity after 60°C exposure; purified miraculin threshold NR", refs.miraculin);
setExisting("SW001", "Crystallization", "MEASURED — sucrose crystallization rose as concentrated aqueous coating solution dried; depends on concentration", refs.candy, false);
setExisting("SW004", "Crystallization", "MEASURED — 20% and 36% erythritol solutions crystallized after drying at 70°C for 2 h", refs.candy, false);
setExisting("SW005", "Crystallization", "MEASURED — xylitol can crystallize on cooling from a concentrated aqueous solution; rate depends on supersaturation and mixing", refs.polyolCrystals, false);
setExisting("SW008", "Crystallization", "MEASURED — maltitol solutions hardly crystallized under a concentrated aqueous coating test; formulation matters", refs.candy, false);
setExisting("SW042", "Solubility", "QUALITATIVE — supplier material reported soluble in water; no equilibrium value or test temperature", "https://www.biocrick.com/download/document/BCN2532/datasheet.pdf");

const acid = new Map();
function acidValue(id, value, ref) { acid.set(id, value); if (ref) record(id, ref); }
acidValue("SW001", "MEASURED — 20% sucrose solution almost completely hydrolysed at pH 2 and 100°C within 60 min", refs.fsaIsomaltulose);
acidValue("SW011", "REPORTED — trehalose solution stable across pH 3.5–10; test duration and exact endpoint vary", refs.fdaTrehalose);
acidValue("SW012", "MEASURED — 20% isomaltulose solution stable for >60 min at pH 2 and 100°C", refs.fsaIsomaltulose);
acidValue("SW019", "MEASURED — acesulfame-K remained stable during storage of whey-lemon beverage at pH 3.7–3.85", refs.aceAsp);
acidValue("SW020", "MEASURED — aspartame remained stable during storage of whey-lemon beverage at pH 3.7–3.85; heating can still cause loss", refs.aceAsp);
acidValue("SW021", "EFSA REVIEW — cola solution showed no detectable loss at 20°C for 12 months; acidic hot/long storage can hydrolyse sucralose", refs.sucralose);
acidValue("SW022", "MEASURED — saccharin essentially unchanged after 1 h at 100–150°C at pH 3.3; losses increase at pH 2", refs.saccharin);
acidValue("SW023", "EFSA REVIEW — relatively stable at pH 3.0–5.5, optimum near pH 4.5; loss rises at very low pH and high heat", refs.neotame);
acidValue("SW024", "REGULATORY TEST — 47.8% advantame remained after 26 weeks in cola-type beverage at pH 3.2 and 25°C", refs.advantame);
acidValue("SW026", "REPORTED — alitame degrades in solution at low pH, especially with heat; no single stable pH interval established here", refs.alitame);
for (let n = 27; n <= 40; n++) {
  if (n === 39 || n === 40) continue;
  const id = `SW${String(n).padStart(3, "0")}`;
  acidValue(id, "CLASS PROXY — EFSA accepts normal acidic-beverage stability for steviol glycosides; pH 2 with heat increases degradation; isolate-specific test NR", refs.efsaSteviol);
}
acidValue("SW034", "MEASURED — rebaudioside M formed degradation products after 24 h at pH 2 and 80°C", refs.rebM);
acidValue("SW040", "MEASURED — steviolbioside showed no decomposition after 2 h at 100°C across pH 2–10", refs.steviolbioside);
acidValue("SW041", "EFSA REVIEW — mogroside V in an extract stable at pH 3, 6 and 12 for 4 weeks at 2–8°C; not stable at pH 1", refs.monk);
acidValue("SW045", "MEASURED — siamenoside I retained about 98% after 26 weeks at 40°C, pH 2.8 in a mock beverage", refs.siamenoside);
acidValue("SW048", "EFSA REVIEW — NHDC resistant to hydrolysis at room temperature above pH 2; strongest stability near pH 4; heat accelerates loss", refs.nhdc);
acidValue("SW051", "PATENT TEST — hernandulcin did not decompose after 24 h at 60°C in pH 2–12 buffers", refs.hernandulcin);
acidValue("SW057", "MEASURED — thaumatin sweetness retained after 4 h at 80°C at pH 2; lost within 15 min above pH 7", refs.thaumatin);
acidValue("SW058", "REPORTED — natural monellin loses sweetness above 50°C at acidic pH; exact beverage shelf stability NR", "https://doi.org/10.1093/protein/2.8.571");
acidValue("SW059", "PATENT TEST — purified brazzein sweetness retained after 2 h at 98°C over pH 2–8", refs.brazzein);
acidValue("SW060", "MEASURED — neoculin is weakly sweet near pH 7 and much sweeter at lower pH; this is taste response, not storage stability", refs.monoNeoculin);
acidValue("SW061", "MEASURED — curculin taste-modifying activity unchanged after 1 h at 50°C over pH 3–11", refs.curculin);
acidValue("SW064", "MEASURED — thaumatin I/II native conformation most stable near pH 5; reversible to 75°C in the tested buffer", refs.thaumatinII);
acidValue("SW065", "REGULATORY ASSAY — miracle-berry preparation retained taste-modifying activity across pH 2–10; purified miraculin test NR", refs.miraculin);

const moisture = new Map();
function moistureValue(id, value, ref) { moisture.set(id, value); if (ref) record(id, ref); }
for (const [id, rh] of [["SW001", "80%"], ["SW004", "90%"], ["SW005", "75%"], ["SW006", "70%"], ["SW007", ">95%"], ["SW008", "85%"]]) {
  moistureValue(id, `MEASURED — dry-powder critical relative humidity ${rh} at 25°C; finished-food moisture effect depends on recipe`, refs.candy);
}
moistureValue("SW002", "MEASURED — allulose showed higher water affinity than sucrose at lower relative humidity in a moisture-sorption study; matrix matters", refs.rareSugar);
moistureValue("SW003", "MEASURED — crystalline tagatose had low equilibrium moisture uptake at water activity 0.65 and 25°C in one study", refs.moisture);
moistureValue("SW009", "FORM-DEPENDENT — lactitol monohydrate remained stable at 25–75% RH in a storage test; anhydrous forms can absorb more", refs.lactitolMoisture);
moistureValue("SW010", "MEASURED — isomalt powder began adsorbing moisture near 85.37% RH in one sorption study", refs.isomaltMoisture);
moistureValue("SW011", "MEASURED — crystalline trehalose absorbed moisture at water activity 0.65 and 25°C; phase changes occurred as humidity rose", refs.moisture);
moistureValue("SW012", "MEASURED — isomaltulose moisture uptake increased near water activity 0.6–0.75 at 25°C; dry form matters", refs.moisture);
moistureValue("SW013", "MEASURED — fructose changes water activity and hydration differently from glucose and sucrose at matched concentrations", "https://pmc.ncbi.nlm.nih.gov/articles/PMC8540113/");
moistureValue("SW014", "MEASURED — glucose changes water activity at defined concentration; no recipe-independent moisture-retention number", "https://pmc.ncbi.nlm.nih.gov/articles/PMC8540113/");
moistureValue("SW016", "REPORTED — crystalline lactose has low moisture uptake until high relative humidity; hydrate form changes result", "https://pmc.ncbi.nlm.nih.gov/articles/PMC8198525/");

const additionalHeaders = [
  "Bulking_Equivalent_g_per_100g_Sucrose",
  "Bulking_Basis",
  "Browning_Potential",
  "Acid_Stability",
  "Moisture_Retention",
  "Cooling_Energy_at_Equal_Sweetness_J",
  "Cooling_Use_Level_Assessment",
  "Crystallization_Use_Assessment",
  "Functional_Property_Sources",
];
const researchHeaders = [...oldHeaders, ...additionalHeaders];
const coolingJg = new Map([
  ["SW001", 18], ["SW003", 42.3], ["SW004", 179.9], ["SW005", 152.7],
  ["SW006", 108.8], ["SW007", 119.2], ["SW008", 79.1], ["SW009", 58.2],
  ["SW010", 39.3], ["SW013", 55.2], ["SW014", 61.1], ["SW017", 95],
]);
const reducing = new Set(["SW002", "SW003", "SW012", "SW013", "SW014", "SW015", "SW016", "SW017"]);
const polyols = new Set(["SW004", "SW005", "SW006", "SW007", "SW008", "SW009", "SW010", "SW018"]);
const proteinIds = new Set(Array.from({ length: 9 }, (_, i) => `SW${String(i + 57).padStart(3, "0")}`));
function potencyFor(row) {
  const value = row[oldIndex.get("Relative_Sweetness_Sucrose_1")];
  if (typeof value === "number" && value > 0) return { numeric: value, basis: "CALC — 100 ÷ relative sweetness; potency varies with concentration" };
  const text = String(value);
  if (/^4000 \(/.test(text)) return { numeric: 4000, basis: "CALC — 100 ÷ reported 4000× potency; preparation-specific" };
  if (/^~1600/.test(text)) return { numeric: 1600, basis: "APPROX CALC — 100 ÷ reported ~1600× potency; preparation-specific" };
  const range = text.match(/~?(\d+)\s*[–-]\s*(\d+)/);
  if (range) {
    const lowMass = 100 / Number(range[2]);
    const highMass = 100 / Number(range[1]);
    return { numeric: null, basis: `RANGE CALC — ${lowMass.toFixed(4)}–${highMass.toFixed(4)} g from ${range[1]}–${range[2]}× potency` };
  }
  return { numeric: null, basis: /^(NR|SPEC|NA|CONFLICT)/.test(text) ? text : `NR — ${text}` };
}
function browningFor(id) {
  if (reducing.has(id)) return "REDUCING SUGAR — can contribute to Maillard browning with amino compounds; colour depends on recipe";
  if (id === "SW001") return "NONREDUCING SUGAR — can brown after heating or hydrolysis; direct Maillard role requires reducing sugars";
  if (id === "SW011") return "NONREDUCING SUGAR — little direct Maillard role; colour depends on other ingredients and heat";
  if (polyols.has(id)) return "NONREDUCING POLYOL — little direct Maillard role; finished food may still brown";
  if (proteinIds.has(id)) return "PROTEIN — amino donor when reducing sugars are present; own colour contribution at use dose NR";
  if (id === "SW023") return "AMINO SWEETENER — EFSA expects little Maillard reaction at typical food pH; recipe-level colour NR";
  if (id === "SW024") return "AMINO SWEETENER — regulatory storage tests found no detectable Maillard products; recipe-level colour NR";
  if (["SW020", "SW026"].includes(id)) return "AMINO SWEETENER — may react with reducing sugars; recipe-level browning NR";
  return "NONREDUCING SWEET COMPOUND — no direct reducing-sugar role; thermal colour contribution NR";
}
const finalRows = rows.map(row => {
  const id = row[0];
  const potency = potencyFor(row);
  const bulk = potency.numeric === null ? null : Number((100 / potency.numeric).toPrecision(6));
  const browning = browningFor(id);
  const acidResult = acid.get(id) ?? "NR — no comparable acidic-food stability test verified for this exact sweetener";
  let moistureResult = moisture.get(id);
  if (!moistureResult && bulk !== null && bulk <= 5) {
    moistureResult = "CALC/INFERENCE — <=5 g per 100 g sucrose-equivalent sweetness; direct bulking or moisture effect small; formulation test needed";
    record(id, refs.cake);
  }
  if (!moistureResult) moistureResult = "NR — no comparable dry-powder or finished-food moisture measurement verified";
  const cooling = bulk !== null && coolingJg.has(id)
    ? Number((bulk * coolingJg.get(id)).toPrecision(6)) : null;
  // The pre-existing source sign conventions differ. Use a positive cooling
  // magnitude and preserve the original signed heat in the original field.
  const coolingUse = cooling !== null
    ? `CALC — ${cooling} J dissolution-energy magnitude per 100 g sucrose-equivalent sweetness; dry crystal and mouthfeel conditions matter`
    : bulk !== null && bulk <= 5
      ? "INFERRED — <=5 g use mass means low bulk cooling contribution; intrinsic dissolution heat NR"
      : "NR — heat of dissolution or sweetness-equivalent mass unavailable for use-level assessment";
  const crystallizationUse = id === "SW004"
    ? "MEASURED RISK — erythritol readily crystallizes when aqueous solution concentrates or cools"
    : id === "SW008"
      ? "MEASURED LOW UNDER TEST — maltitol resisted crystallization in concentrated coating solution"
      : id === "SW001"
        ? "MEASURED CONDITIONAL — sucrose crystallization increases when concentrated solution dries"
        : id === "SW005"
          ? "MEASURED CONDITIONAL — xylitol crystallizes from concentrated aqueous solution on cooling; recipe concentration matters"
        : bulk !== null && bulk <= 5
          ? "INFERRED — low bulk crystal contribution at equal sweetness; precipitation still requires solubility and water check"
          : "CONDITION-DEPENDENT — recipe concentration, water, cooling rate and other ingredients required";
  if (reducing.has(id) || polyols.has(id) || id === "SW001" || id === "SW011") record(id, refs.biscuits);
  if (id === "SW023") record(id, refs.neotame);
  const links = [...evidence.get(id)].join(" ; ");
  return [...row, bulk, potency.basis, browning, acidResult, moistureResult, cooling, coolingUse, crystallizationUse, links || "NR — no new property-specific source used"];
});

// Keep the expanded research JSON in sync with the numeric workbook. The
// original source text remains in selected_data.json for historical review.
for (const row of finalRows) {
  const item = solubilityAudit.get(row[0]);
  if (!item) throw new Error(`Missing solubility audit for ${row[0]}`);
  row[oldIndex.get("Solubility")] = item.value === "N/A"
    ? `NR — ${item.finding}`
    : `${item.value} g/L water (approximate); ${item.conditions}; ${item.finding}`;
  const allLinks = new Set([...String(row.at(-1)).split(" ; ").filter(link => /^https?:\/\//.test(link)), ...item.sources]);
  row[row.length - 1] = allLinks.size ? [...allLinks].join(" ; ") : "NR — no new property-specific source used";
  for (const link of item.sources) record(row[0], link);
}

function simpleText(value) {
  if (typeof value !== "string") return value;
  if (/^NR\s*—/.test(value)) return "Not available";
  if (/^NA\s*—/.test(value)) return "Not applicable";
  if (/^SPEC\s*—/.test(value)) return "Varies by recipe or product";
  if (/^CONFLICT\s*—/.test(value)) return "Unclear; published results disagree";
  let text = value;
  text = text.replace(/(^|;\s*)(?:RETAINED|CALC\/INFERENCE|APPROX CALC|RANGE CALC|CALC|MEASURED LOW UNDER TEST|MEASURED CONDITIONAL|MEASURED RISK|MEASURED|EFSA REVIEW|REGULATORY TEST|REGULATORY ASSAY|PATENT TEST|REPORTED|QUALITATIVE)\s*—\s*/g, "$1");
  text = text.replace(/^CLASS PROXY\s*—\s*/, "Based on related sweeteners: ");
  text = text.replace(/^INFERRED\s*—\s*/, "Likely: ");
  text = text.replace(/^FORM-DEPENDENT\s*—\s*/, "Depends on the form: ");
  text = text.replace(/^CONDITION-DEPENDENT\s*—\s*/, "Depends on the recipe: ");
  text = text.replace(/\bNR\b/g, "not available");
  text = text.replace(/\s*\((?:Source table designation|Table value|As reported in source table|Reported food energy value|source sign retained)\)/gi, "");
  text = text.replace(/\bcalculated estimate\b/gi, "estimate");
  text = text.replace(/\bretained taste-modifying activity\b/gi, "kept taste-modifying activity");
  text = text.replace(/\bretained\b/gi, "remained");
  text = text.replace(/^Depends on the recipe: recipe /, "Depends on the recipe: ");
  return text.trim();
}
const displayRows = finalRows.map(row => row.map(simpleText));
const researchIndex = new Map(researchHeaders.map((name, index) => [name, index]));
const field = (row, name) => row[researchIndex.get(name)];
const numberOrNA = value => typeof value === "number" && Number.isFinite(value) ? value : "N/A";
const matchNumber = (value, pattern, multiplier = 1) => {
  const match = String(value ?? "").match(pattern);
  return match ? Number(match[1].replace("−", "-")) * multiplier : "N/A";
};
function meltingPoint(value) {
  const text = String(value ?? "");
  if (/\d\s*[–-]\s*\d|decompos|without true melting/i.test(text)) return "N/A";
  return matchNumber(text, /([−-]?\d+(?:\.\d+)?)\s*°\s*C/i);
}
function glassTransition(value) {
  const text = String(value ?? "");
  if (/\d\s*[–-]\s*\d/.test(text)) return "N/A";
  return matchNumber(text, /([−-]?\d+(?:\.\d+)?)\s*°\s*C/i);
}
function adi(value, authority) {
  const text = String(value ?? "");
  if (authority === "FDA") return matchNumber(text, /US FDA:\s*(\d+(?:\.\d+)?)/i);
  if (authority === "EFSA") {
    if (/EFSA ADI:\s*0\.5\s*g\/kg/i.test(text)) return 500;
    return matchNumber(text, /EFSA(?:\s*\(\d{4}\))?(?:\/JECFA)?:\s*(\d+(?:\.\d+)?)\s*mg/i);
  }
  if (/steviol equivalents/i.test(text)) return "N/A";
  const joint = matchNumber(text, /EFSA\/JECFA:\s*(\d+(?:\.\d+)?)/i);
  if (joint !== "N/A") return joint;
  return matchNumber(text, /JECFA ADI:\s*0[–-](\d+(?:\.\d+)?)\s*mg/i);
}
const numericColumns = [
  ["Relative_Sweetness_Sucrose_1", row => {
    const value = field(row, "Relative_Sweetness_Sucrose_1");
    if (numberOrNA(value) !== "N/A") return value;
    if (/\d\s*[–-]\s*\d/.test(String(value))) return "N/A";
    return matchNumber(value, /^~?(\d+(?:\.\d+)?)(?:\s*\(|\s*×)/);
  }],
  ["PubChem_CID", row => numberOrNA(field(row, "PubChem_CID"))],
  ["Molecular_Weight_g_mol", row => numberOrNA(field(row, "Molecular_Weight_g_mol"))],
  ["Solubility_Approx_g_L_Water", row => solubilityAudit.get(row[0])?.value ?? "N/A"],
  ["Freezing_Point_Ratio_to_Sucrose", row => proteinIds.has(row[0]) ? "N/A" : matchNumber(field(row, "Freezing_Point_Effect"), /^(\d+(?:\.\d+)?)\s*×/)],
  ["Heat_Max_C", row => matchNumber(field(row, "Heat_Stability"), /^<\s*(\d+(?:\.\d+)?)\s*°/)],
  ["Heat_Stable_Through_C", row => matchNumber(field(row, "Heat_Stability"), /^>\s*(\d+(?:\.\d+)?)\s*°/)],
  ["Heat_Filter_Flag", row => heatFindings[row[0]]?.exclude_when_heated ? 1 : 0],
  ["Heat_Review_C", row => numberOrNA(heatFindings[row[0]]?.temperature_review_c)],
  ["Cooling_Heat_of_Solution_J_g", row => {
    const matches = [...String(field(row, "Cooling_Effect_Heat_of_Solution") ?? "").matchAll(/([+−-]?\d+(?:\.\d+)?)\s*J\/g/gi)];
    return matches.length ? Number(matches.at(-1)[1].replace("−", "-")) : "N/A";
  }],
  ["Melting_Point_C", row => meltingPoint(field(row, "Melting_Point"))],
  ["Glass_Transition_C", row => glassTransition(field(row, "Glass_Transition_Temperature"))],
  ["Viscosity_mPa_s", row => matchNumber(field(row, "Viscosity"), /([\d.]+)\s*mPa[·.]?s/i)],
  ["Viscosity_Test_Concentration_pct", row => matchNumber(field(row, "Viscosity"), /\(([\d.]+)%\s*(?:w\/w|solution)/i)],
  ["Viscosity_Test_C", row => matchNumber(field(row, "Viscosity"), /,\s*([\d.]+)\s*°\s*C\)/i)],
  ["Calories_kcal_g", row => matchNumber(field(row, "Calories"), /^(\d+(?:\.\d+)?)\s*kcal\/g/i)],
  ["Glycemic_Index", row => matchNumber(field(row, "Glycemic_Index"), /^(\d+(?:\.\d+)?)\s*(?:±|GI units)/i)],
  ["ADI_FDA_mg_kg_day", row => adi(field(row, "ADI"), "FDA")],
  ["ADI_EFSA_mg_kg_day", row => adi(field(row, "ADI"), "EFSA")],
  ["ADI_JECFA_mg_kg_day", row => adi(field(row, "ADI"), "JECFA")],
  ["ADI_Steviol_Equiv_mg_kg_day", row => /steviol equivalents/i.test(String(field(row, "ADI"))) ? 4 : "N/A"],
  ["Bulking_Equivalent_g_per_100g_Sucrose", row => numberOrNA(field(row, "Bulking_Equivalent_g_per_100g_Sucrose"))],
  ["Critical_Relative_Humidity_pct", row => matchNumber(field(row, "Moisture_Retention"), /critical relative humidity\s+(\d+(?:\.\d+)?)%/i)],
  ["Cooling_Energy_at_Equal_Sweetness_J", row => numberOrNA(field(row, "Cooling_Energy_at_Equal_Sweetness_J"))],
  ["Reducing_Sugar_Flag", row => reducing.has(row[0]) ? 1 : 0],
  ["Yeast_Fermentability_Flag", row => {
    const note = String(field(row, "Fermentability_Experimental") ?? "");
    if (/not metabolized/i.test(note)) return 0;
    if (/completely removed|partially removed|mostly consumed/i.test(note)) return 1;
    return "N/A";
  }],
  ["Crystallization_Observed_Flag", row => (["SW001", "SW004", "SW005"].includes(row[0]) ? 1 : row[0] === "SW008" ? 0 : "N/A")],
];
const headers = ["Sweetener_ID", "Name", ...numericColumns.map(([name]) => name)];
const numericRows = displayRows.map(row => [row[0], row[1], ...numericColumns.map(([, get]) => get(row))]);
if (numericRows.some(row => !solubilityAudit.has(row[0]))) throw new Error("A sweetener is missing a solubility audit");
for (const row of numericRows) {
  if (row.slice(2).some(value => value !== "N/A" && (typeof value !== "number" || !Number.isFinite(value)))) {
    throw new Error(`Non-numeric property value in ${row[0]}`);
  }
}

const workbook = Workbook.create();
const sheet = workbook.worksheets.add("Sweeteners");
sheet.showGridLines = false;
const lastRow = numericRows.length + 1;
function excelColumn(number) {
  let result = "";
  while (number > 0) {
    number--;
    result = String.fromCharCode(65 + number % 26) + result;
    number = Math.floor(number / 26);
  }
  return result;
}
const lastCol = excelColumn(headers.length);
const all = sheet.getRange(`A1:${lastCol}${lastRow}`);
all.values = [headers, ...numericRows];
all.format.fill = "#FFFFFF";
all.format.font = { name: "Arial", size: 10, color: "#000000" };
all.format.verticalAlignment = "center";
all.format.wrapText = false;
const widths = headers.map((name, index) => index === 0 ? 15 : index === 1 ? 34 : Math.min(36, Math.max(23, name.length + 2)));
for (let i = 0; i < widths.length; i++) {
  sheet.getRangeByIndexes(0, i, lastRow, 1).format.columnWidth = widths[i];
}
const header = sheet.getRange(`A1:${lastCol}1`);
header.format = {
  fill: "#000000",
  font: { name: "Arial", size: 10, bold: true, color: "#FFFFFF" },
  verticalAlignment: "center",
  horizontalAlignment: "center",
  wrapText: true,
};
header.format.rowHeight = 68;
sheet.getRange(`C2:${lastCol}${lastRow}`).format.horizontalAlignment = "right";
sheet.getRange(`A2:${lastCol}${lastRow}`).format.rowHeight = 23;
const table = sheet.tables.add(`A1:${lastCol}${lastRow}`, true, "SweetFixSweeteners");
table.style = "TableStyleLight1";
table.showFilterButton = true;
sheet.freezePanes.freezeRows(1);
workbook.recalculate();
const inspect = await workbook.inspect({ kind: "table", range: "Sweeteners!A1:E4", include: "values", tableMaxRows: 4, tableMaxCols: 5, maxChars: 1500 });
console.log(inspect.ndjson);
const ending = await workbook.inspect({ kind: "table", range: `Sweeteners!X62:${lastCol}66`, include: "values", tableMaxRows: 5, tableMaxCols: 7, maxChars: 2000 });
console.log(ending.ndjson);
const errors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!", options: { useRegex: true, maxResults: 100 }, summary: "formula error scan" });
console.log(errors.ndjson);
const overviewPreview = await workbook.render({ sheetName: "Sweeteners", range: "A1:H8", scale: 1, format: "png" });
await fs.writeFile(path.join(buildDir, "SweetFix_Numeric_Overview.png"), new Uint8Array(await overviewPreview.arrayBuffer()));
const detailsPreview = await workbook.render({ sheetName: "Sweeteners", range: "H1:O8", scale: 1, format: "png" });
await fs.writeFile(path.join(buildDir, "SweetFix_Numeric_Details.png"), new Uint8Array(await detailsPreview.arrayBuffer()));
const exported = await SpreadsheetFile.exportXlsx(workbook);
await exported.save(outputPath);
await fs.writeFile(path.join(buildDir, "SweetFix_Full_Research_65.json"), JSON.stringify({ headers: researchHeaders, rows: finalRows }, null, 2), "utf8");

const auditedSolubilityCount = [...solubilityAudit.values()].filter(item => typeof item.value === "number").length;
const solubilityLines = [
  "# SweetFix water-solubility audit: SW001–SW065",
  "",
  "Reviewed 2026-11-18. This audit covers the 65 SW records in the main sweetener database. The separate natural-sweeteners file was not reviewed or changed. The search used original research papers, regulatory test reports and original patents; it cannot establish that every publication ever written was found.",
  "",
  `The numeric submission workbook contains ${auditedSolubilityCount} selected solubility numbers and ${65 - auditedSolubilityCount} N/A entries. N/A means no defensible *single* numeric pure-water saturation value from this review, not that the ingredient is insoluble. Some selected numbers are explicitly provisional because the original method or form could not be checked.`,
  "",
  "Values are approximately grams of sweetener per litre of initial water. A source value in g per 100 g water was multiplied by 10, using 1 kg water ≈ 1 L. Values reported per litre of final solution, percentages without a stated basis, stocks, upper/lower bounds, and pH- or salt-dependent protein measurements are not silently treated as equivalent. Temperature, pH and form are in the table because these change solubility.",
  "",
  "| ID | Sweetener | Workbook g/L water | Conditions | Original basis / conversion | Evidence and decision | Source |",
  "| --- | --- | ---: | --- | --- | --- | --- |",
  ...displayRows.map(row => {
    const item = solubilityAudit.get(row[0]);
    const sources = item.sources.length ? item.sources.map((url, i) => `[${i + 1}](${url})`).join(", ") : "No direct source located";
    return `| ${row[0]} | ${row[1]} | ${item.value} | ${item.conditions} | ${item.basis} | ${item.finding} | ${sources} |`;
  }),
  "",
  "## Important conflicts and limitations",
  "",
  "- SW013 fructose has a direct 20°C measurement of 159 g/100 mL initial water in the selected thesis, while a separate published sugar-solubility compilation gives about 79.2% w/w at 20°C. The workbook number is a study-specific observation and should not be used as a universal saturation ceiling without a controlled repeat.",
  "- SW031 rebaudioside D was previously 0.05 because a generic parser selected the uncertainty in 0.57 ± 0.05 mg/mL. The chosen central value is now 0.57 g/L. A second direct experiment measured 0.43 g/L on its preparation; formulation needs the relevant solid form.",
  "- SW024 advantame is a 30-minute test at 15°C. SW039 rubusoside is an original patent assertion without a described independent equilibrium protocol. SW005–SW007, SW009–SW010, SW015–SW016 and SW018 retain provisional previously reported figures. These need new direct tests or original laboratory reports before being used as hard recipe constraints.",
  "- SW025 is cyclamic acid by formula and PubChem CID. The literature commonly discusses sodium cyclamate, which is a different salt. Do not swap their solubility values.",
  "- The 65-row audit is the source and limitations record. The submission workbook intentionally keeps only ID, name, numbers and N/A for code use.",
  "",
];
await fs.writeFile(solubilityAuditPath, solubilityLines.join("\n"), "utf8");

const measuredAcid = finalRows.filter(row => /^(MEASURED|EFSA REVIEW|REGULATORY|PATENT TEST|REPORTED)/.test(row[24])).length;
const approxAcid = finalRows.filter(row => /^CLASS PROXY/.test(row[24])).length;
const sourceCount = new Set([...evidence.values()].flatMap(set => [...set])).size;
const noteLines = [
  "# SweetFix functional-property research",
  "",
  "Scope: SW001–SW065 in the main sweetener database only. The separate natural-sweeteners workbook was not changed. The seven ING extracts/blends were excluded. SW010 isomalt remains because it is within the first 65 IDs; its Entity_Type correctly records it as a polyol mixture.",
  "",
  "The single-sheet submission workbook is a numeric extract for code use. Sweetener_ID and Name are the only text identifiers. Every other data cell is a real number or the literal N/A. Narrative research values, identity links, source URLs, and conditional observations are kept in the full research JSON in _database_build and in these notes, not mixed into numeric property cells.",
  "",
  "## Numeric workbook rules",
  "",
  "- Units are in column names. N/A means no defensible single numeric value for that field, including missing data, most ranges, qualitative results, or condition-dependent observations. It never means zero. A regulatory ADI written 0–X is recorded as its upper limit X.",
  "- Solubility_Approx_g_L_Water uses the separate 65-row solubility audit. It converts reported g/kg water to an approximate g/L water using 1 kg water ≈ 1 L; it omits upper/lower bounds, mixtures of forms, and values that are only stock concentrations. Source temperature, form, method and provisional status are in SweetFix_Solubility_Audit_65.md.",
  "- Heat_Max_C is filled only for an explicit <X°C ceiling. Heat_Stable_Through_C is filled only for an explicit >X°C statement. A melting point, a stable test temperature, and a cooking temperature are not substitutes for a heat ceiling.",
  "- Heat_Filter_Flag mirrors the current demo rule: 1 means the existing heat screen excludes that sweetener when heated; 0 means that particular rule does not exclude it, not that heat stability has been established. Heat_Review_C is a review trigger, not a hard safety limit.",
  "- Cooling_Heat_of_Solution_J_g keeps the signed J/g value reported or converted in the research record. Cooling_Energy_at_Equal_Sweetness_J is a positive magnitude based on the sweetness-equivalent mass; it is not a sensory cooling score.",
  "- ADI columns are separated by authority. ADI_Steviol_Equiv_mg_kg_day is in steviol-equivalent units and requires conversion before applying it to glycoside mass. No regulatory limit is inferred where the source says not specified.",
  "- Reducing_Sugar_Flag is 1 for the identified reducing sugars and 0 for other listed entities. Yeast_Fermentability_Flag is 1 for the stated yeast consumption tests, 0 for the stated non-metabolism tests, and N/A otherwise. Crystallization_Observed_Flag reflects only the specific concentrated-solution tests; 0 for maltitol under that test is not a universal no-crystallization claim.",
  "",
  "## Methods",
  "",
  "- Bulking_Equivalent_g_per_100g_Sucrose = 100 / mass-relative sweetness. This is a sweetness-equivalent ingredient mass, not a prediction that it reproduces sugar's texture. Text potency ranges have their calculated mass range in Bulking_Basis; the numeric cell is blank.",
  "- Cooling_Energy_at_Equal_Sweetness_J = absolute value of previously recorded dissolution heat in J/g times the calculated sweetness-equivalent mass. It is an ideal comparison of isolated dry ingredients dissolving under the cited test conditions, not a measured cooling sensation in a finished recipe. Hydrate-specific heats for trehalose, maltose and lactose were not multiplied by sweetness mass because the solid forms may differ. Source sign conventions differ; original signed values remain in Cooling_Effect_Heat_of_Solution.",
  "- Browning_Potential identifies chemical roles. REDUCING SUGAR means possible Maillard browning with amino ingredients. NONREDUCING does not mean a baked food cannot brown. Proteins and some amino sweeteners can react with reducing sugars supplied elsewhere in the recipe.",
  "- Moisture_Retention reports a dry-powder critical relative humidity or other stated moisture measurement where one was found. For high-intensity sweeteners, the low-bulk assessment follows from <=5 g per 100 g sucrose-equivalent sweetness; it is not a measured final-food water activity.",
  "- Acid_Stability preserves pH, temperature, time, matrix and whether evidence is exact, a regulatory review, or a class proxy. A class proxy cannot be treated as a compound-specific heat or acid limit.",
  "- Cooling_Use_Level_Assessment and Crystallization_Use_Assessment distinguish measured behaviour from low-mass inference. Neither gives a final-food result without recipe water, concentration and processing conditions.",
  "- NR means no verified comparable value for the exact entity and conditions. It is not zero or evidence of instability. Published work rarely gives dissolution enthalpy, crystallization kinetics, or moisture sorption for the minor isolated glycosides and sweet proteins, so these cells stay explicit rather than guessed.",
  "- The submission workbook contains numeric property values only, plus Sweetener_ID and Name. Research status and detailed conditions remain in the full research record and these notes.",
  "",
  "## Coverage",
  "",
  `- 65 IDs in the numeric workbook; 7 ING records excluded; ${headers.length} columns total. Water solubility: ${auditedSolubilityCount} selected numeric values and ${65 - auditedSolubilityCount} N/A entries.`,
  `- ${finalRows.filter(row => typeof row[21] === "number").length} numerical bulking equivalents; ${finalRows.filter(row => typeof row[26] === "number").length} numerical equal-sweetness cooling comparisons.`,
  `- ${measuredAcid} exact/reviewed acid entries, ${approxAcid} steviol-glycoside class proxies, and ${finalRows.filter(row => String(row[24]).startsWith("NR")).length} acid entries without comparable evidence.`,
  `- ${sourceCount} unique source links used in this update (some apply to a class or measurement protocol).`,
  "",
  "## Core sources",
  "",
  ...Object.entries(refs).map(([name, url]) => `- ${name}: ${url}`),
  "",
];
await fs.writeFile(notesPath, noteLines.join("\n"), "utf8");
console.log(JSON.stringify({ outputPath, notesPath, solubilityAuditPath, records: finalRows.length, columns: headers.length, solubilityValues: auditedSolubilityCount, sourceCount, measuredAcid, approxAcid }));
