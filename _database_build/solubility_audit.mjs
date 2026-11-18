// One selected water-solubility value per SW ingredient. The accompanying
// submission audit records the measurement conditions and source limitations.
const source = {
  han: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8017078/",
  fsanzAllulose: "https://www.foodstandards.gov.au/sites/default/files/2023-12/A1247%20Samyang%20D-Allulose%20FSANZ%20application_Redacted.pdf",
  polyolTest: "https://patents.google.com/patent/US20030138485A1/en",
  maltitol: "https://patents.google.com/patent/US4789559A/en",
  trehalose: "https://www.sciencedirect.com/science/article/pii/S0308814697001325",
  sugars: "https://etheses.whiterose.ac.uk/id/eprint/33945/1/Kashbor%2C%20Mohamed%2C%20Doped%20Zeolite-Based%20Catalysts%20for%20Selective%20Glucose%20Isomerisation%20and%20Fructose%20Dehydration.pdf",
  glucoseFructoseComparison: "https://www.sciencedirect.com/science/article/abs/pii/S0021967309001071",
  saccharides37: "https://trc.nist.gov/ThermoML/10.1021/je700190m.html",
  galactose: "https://doi.org/10.3168/jds.s0022-0302(40)95516-3",
  aceK: "https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2025.9317",
  sucralose: "https://doi.org/10.1111/j.1365-2621.1989.tb05179.x",
  saccharin: "https://www.pmcsg.com/wp-content/uploads/2015/05/TB_solubility.pdf",
  neotame: "https://electronicsandbooks.com/edt/manual/Magazine/F/Food%20Chemistry/2000/Vol.69/245_257.pdf",
  advantame: "https://www.foodstandards.gov.au/sites/default/files/food-standards-code/applications/Documents/A1034%20Advantame%20AppR%20SD1%20Risk%20Assess.pdf",
  cyclamate: "https://pubchem.ncbi.nlm.nih.gov/compound/7533",
  alitame: "https://www.fao.org/fileadmin/user_upload/jecfa_additives/docs/Monograph1/Additive-010.pdf",
  steviolDirect: "https://www.mdpi.com/2304-8158/14/11/1917",
  steviol2026: "https://www.mdpi.com/2304-8158/15/15/2647",
  rebB: "https://patents.google.com/patent/US9090647B2/en",
  rebC: "https://cdn.caymanchem.com/cdn/insert/11895.pdf",
  rebM: "https://www.mdpi.com/2304-8158/3/1/162",
  rebMPatent: "https://patents.google.com/patent/WO2019071182A1/en",
  rubusoside: "https://patents.google.com/patent/US20120329738A1/en",
  steviolbioside: "https://doi.org/10.1007/s13197-016-2450-2",
  mogrosideV: "https://doi.org/10.3390/separations12060135",
  monkExtract: "https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2019.5921",
  siamenoside: "https://ijpsr.com/bft-article/stability-of-monk-fruit-sweetener-siamenoside-i-under-acidic-and-thermal-conditions-and-its-degradation-products/?view=fulltext",
  glycyrrhizin: "https://www.sciencedirect.com/science/article/pii/S0927775716302643",
  nhdc: "https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2022.7595",
  dihydrochalcones: "https://doi.org/10.1111/ijfs.13796",
  hernandulcin: "https://patents.google.com/patent/US4808409A/en",
  thaumatin: "https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2021.6884",
  proteinSolubility: "https://www.yu.edu/sites/default/files/inline-files/6-cgd08.pdf",
  monellin: "https://www.ebm-journal.org/journals/experimental-biology-and-medicine/articles/10.3181/00379727-179-42066/pdf",
  brazzein: "https://doi.org/10.1002/jat.4811",
  thaumatinII: "https://www.fda.gov/media/140368/download",
  miraculin: "https://www.fda.gov/media/156660/download",
};

const audit = new Map();
function put(id, value, conditions, basis, sources, finding) {
  if (audit.has(id)) throw new Error(`Duplicate solubility audit: ${id}`);
  audit.set(id, { value, conditions, basis, sources: sources.map(key => source[key] ?? key), finding });
}
const na = (id, finding, sources = []) => put(id, "N/A", "Water; comparable saturation condition unavailable", "No single numeric limit", sources, finding);

put("SW001", 2229.3, "25°C; sucrose; water", "222.93 g/100 g water × 10", ["han"], "Direct saturation measurement; earlier sheet used 2030.3 g/L from a rounded 67% w/w table.");
put("SW002", 3242, "25°C; D-allulose; water", "324.2 g/100 mL water × 10", ["fsanzAllulose"], "Application reports a tested water-solubility value.");
put("SW003", 1467.3, "25°C; D-tagatose; water", "146.73 g/100 g water × 10", ["han"], "Direct saturation measurement; earlier 1600 g/L used a different 20°C source.");
put("SW004", 622.9, "25°C; erythritol; water", "62.29 g/100 g water × 10", ["han", "polyolTest"], "Direct saturation measurement. Patent also reports a separate 37°C value.");
put("SW005", 1777.8, "25°C; xylitol; water", "Previous 64% w/w saturated solution → 1000×64/36", ["polyolTest"], "The earlier 25°C figure is retained provisionally. The original 37°C patent gives 74% w/v, which has a different basis and cannot verify the 25°C number.");
put("SW006", 2448.3, "25°C; sorbitol; water", "Previous 71% w/w saturated solution → 1000×71/29", ["polyolTest"], "Earlier figure retained provisionally. The original 37°C test reports at least 88% w/v, not an exact saturation endpoint.");
put("SW007", 219.5, "25°C; mannitol; water", "Previous 18% w/w saturated solution → 1000×18/82", ["polyolTest"], "Earlier figure retained provisionally. Original patent measured 24% w/v at 37°C; its basis and temperature differ.");
put("SW008", 1650, "25°C; anhydrous maltitol; water", "165 g/100 g water × 10", ["maltitol"], "Patent gives a direct dissolution limit for a defined crystalline form. Previous sheet gave 1500 g/L from rounded 60% w/w.");
put("SW009", 1381, "25°C; lactitol; water", "Previous 58% w/w saturated solution → 1000×58/42", [], "Provisional prior-table value. The 58% basis and lactitol hydrate/form could not be checked against a direct saturation experiment.");
put("SW010", 388.9, "25°C; isomalt mixture; water", "Previous 28% w/w saturated solution → 1000×28/72", [], "Provisional prior-table value. Isomalt composition varies, so the result cannot be generalized to every grade.");
put("SW011", 872.7, "20°C; trehalose sample; water", "46.6% w/w saturated solution → 1000×46.6/53.4", ["trehalose"], "Original saturation study; sample water content was 9.66%. Earlier 689 g/L came from a different reference/solid-form convention.");
put("SW012", 596.7, "25°C; isomaltulose; water", "59.67 g/100 g water × 10", ["han"], "Direct saturation measurement fills a previous N/A.");
put("SW013", 1590, "20°C; D-fructose; water", "159 g/100 mL solvent × 10", ["sugars", "glucoseFructoseComparison"], "Direct thesis measurement; other literature reports substantially higher saturation fractions. Treat this as study-specific, not a universal limit.");
put("SW014", 800, "20°C; D-glucose; water", "80 g/100 mL solvent × 10", ["sugars", "saccharides37"], "Direct thesis measurement; earlier 479 g/L may use a different solution-volume basis or solid form.");
put("SW015", 780, "20°C; maltose; water", "Earlier 780000 mg/L ÷ 1000", ["saccharides37", "polyolTest"], "Prior value retained provisionally; original studies confirm saturation depends on temperature and hydrate but do not establish this exact 20°C figure.");
put("SW016", 195, "20°C; lactose; water", "Earlier reported 195 g/L", ["saccharides37", "polyolTest"], "Prior value retained provisionally; original studies use other temperatures/forms.");
put("SW017", 472.5, "25°C; equilibrated D-galactose; water", "47.25 g/100 g water × 10", ["galactose"], "Original equilibrium measurement.");
put("SW018", 729, "Temperature not given; D-arabitol; water", "729 mg/mL = 729 g/L", ["https://pubchem.ncbi.nlm.nih.gov/compound/94154"], "Database-reported value, provisional because the original method and temperature are absent.");
put("SW019", 237, "20°C; acesulfame potassium; water", "237 g/L", ["aceK"], "Regulatory review reports an OECD TG 105 water-solubility test.");
na("SW020", "Aspartame solubility changes substantially with pH; the earlier 13.5–20 mg/mL range cannot be collapsed to one value.");
put("SW021", 283, "20°C; sucralose; water", "28.3 g/100 mL water × 10", ["sucralose"], "Original physicochemical study.");
put("SW022", 4, "25°C; free-acid saccharin; water", "4 mg/mL = 4 g/L", ["saccharin"], "Acid form only. Sodium/calcium saccharin salts are much more soluble.");
put("SW023", 12.6, "25°C; neotame; water", "12.6 g/kg water ≈ 12.6 g/L water", ["neotame"], "Original characterization; conversion approximates 1 kg water as 1 L.");
put("SW024", 0.76, "15°C; advantame; water; 30-minute test", "0.076 g/dL × 10", ["advantame"], "Regulatory dossier test; a timed dissolution result, so do not treat as a guaranteed 25°C equilibrium ceiling.");
put("SW025", 133.3, "Temperature not stated; cyclamic acid; water", "1 g per 7.5 mL water → approximately 133.3 g/L", ["cyclamate"], "SW025 formula is cyclamic acid (C6H13NO3S). Do not apply this value to sodium cyclamate.");
put("SW026", 130, "Room temperature; pH 5; alitame; water", "Reported approximately 130 g/L", ["alitame"], "pH-specific reported figure; hydrate state not specified.");
put("SW027", 12.02, "25°C; stevioside; water", "12.02 mg/mL = 12.02 g/L", ["steviol2026"], "2026 paper tabulates an earlier original study. Substantially above the previous 1.25 g/L; preparation/form may explain disagreement.");
put("SW028", 4.55, "25°C; purified rebaudioside A; deionized water; 24 h", "4.55 mg/mL = 4.55 g/L", ["steviolDirect"], "Excess solid stirred, centrifuged, filtered and measured by HPLC.");
na("SW029", "Patent gives <0.5 mg/mL for a defined Reb B crystal form, an upper bound rather than an exact saturation result.", ["rebB"]);
na("SW030", "The available 10 mg/mL figure is for PBS at pH 7.2 and is not a pure-water equilibrium value.", ["rebC"]);
put("SW031", 0.57, "25°C; purified rebaudioside D; water", "0.57 ± 0.05 mg/mL; central value = 0.57 g/L", ["steviol2026", "steviolDirect"], "Corrects the old parser error that picked the ±0.05 uncertainty. Another direct study obtained 0.43 g/L with its own preparation.");
put("SW032", 0.34, "25°C; purified rebaudioside E; deionized water; 24 h", "0.34 mg/mL = 0.34 g/L", ["steviolDirect"], "Excess solid stirred, centrifuged, filtered and measured by HPLC.");
na("SW033", "No original pure-water saturation measurement for isolated Reb F with a stated temperature/form was located.");
na("SW034", "Reb M reports differ by crystalline versus amorphous form and by instantaneous versus equilibrium measurement; the 0.26% equilibrium figure does not define the percentage basis.", ["rebM", "rebMPatent"]);
na("SW035", "No original pure-water saturation measurement for isolated Reb N with a stated temperature/form was located.");
na("SW036", "No original pure-water saturation measurement for isolated Reb O with a stated temperature/form was located.");
na("SW037", "No original pure-water saturation measurement for isolated Reb I with a stated temperature/form was located.");
na("SW038", "No original pure-water saturation measurement for isolated dulcoside A with a stated temperature/form was located.");
put("SW039", 400, "25°C; purified rubusoside; water", "Patent claims approximately 400 mg/mL = 400 g/L", ["rubusoside"], "Original patent claim, but independent equilibrium method is not shown; provisional.");
na("SW040", "The original paper says steviolbioside is water soluble but gives no saturation concentration.", ["steviolbioside"]);
na("SW041", "An original experiment prepared a 10 mg/mL mogroside V stock; a dissolved stock is only a lower bound, not a saturation limit. EFSA data concern mixed monk-fruit extracts.", ["mogrosideV", "monkExtract"]);
na("SW042", "Only qualitative water-solubility descriptions for isolated mogroside IV were located.");
na("SW043", "No original pure-water saturation measurement for isolated mogroside III was located.");
na("SW044", "No original pure-water saturation measurement for isolated mogroside IIe was located.");
na("SW045", "Siamenoside I beverage/storage solutions were studied, but no pure-water saturation limit was measured.", ["siamenoside"]);
na("SW046", "Monk-fruit extract data include 11-oxo-mogroside V in mixtures; no isolated pure-water saturation value was located.", ["monkExtract"]);
na("SW047", "Original study reports glycyrrhizic-acid aqueous solubility near 0.15 mM, but the result is pH- and form-dependent; no transferable single value selected.", ["glycyrrhizin"]);
put("SW048", 0.23, "20 ± 0.5°C; pH 6.14–6.26; NHDC; water", "0.23 g/L", ["nhdc"], "OECD TG 105 shake-flask test with HPLC. An older one-minute test gave 0.4 g/L; the regulatory review prefers the 0.23 g/L measurement.");
put("SW049", 0.2, "20°C; naringin dihydrochalcone; water", "Reported approximately 0.2 g/L", ["dihydrochalcones"], "Original study of dihydrochalcone water solubility.");
na("SW050", "No measured pure-water saturation limit for isolated phyllodulcin was located; published estimated values were not used.");
na("SW051", "A patent prepared at least 0.1 wt% hernandulcin in aqueous buffers, but did not measure pure-water equilibrium saturation.", ["hernandulcin"]);
na("SW052", "No measured pure-water saturation limit for isolated osladin was located.");
na("SW053", "No measured pure-water saturation limit for isolated polypodoside A was located.");
na("SW054", "No measured pure-water saturation limit for isolated periandrin I was located.");
put("SW055", 0.8, "20°C; trilobatin; water", "Reported approximately 0.8 g/L", ["dihydrochalcones"], "Original dihydrochalcone study.");
na("SW056", "No measured pure-water saturation limit for isolated pterocaryoside A was located.");
na("SW057", "EFSA reports visual dissolution of a thaumatin preparation between about 330 and <500 g/L at 20°C, not an exact equilibrium value. Protein form and salts matter.", ["thaumatin", "proteinSolubility"]);
na("SW058", "An original study used 3 mg/mL monellin as a solution; no saturation endpoint was measured.", ["monellin"]);
na("SW059", "A study dissolved at least 50.31 mg/mL brazzein material; this is a lower bound, not a measured saturation endpoint.", ["brazzein"]);
na("SW060", "No isolated neoculin pure-water saturation measurement with defined pH and form was located.");
na("SW061", "No isolated curculin pure-water saturation measurement with defined pH and form was located.");
na("SW062", "No isolated mabinlin II pure-water saturation measurement with defined pH and form was located.");
na("SW063", "No isolated pentadin pure-water saturation measurement with defined pH and form was located.");
na("SW064", "FDA dossier visually dissolves at least 200 mg/mL thaumatin II; a lower bound is not an exact equilibrium value.", ["thaumatinII"]);
na("SW065", "A digestion experiment prepared 3.67 mg/mL miraculin in water/PBS; this is not an equilibrium saturation measurement.", ["miraculin"]);

if (audit.size !== 65) throw new Error(`Expected 65 solubility decisions, got ${audit.size}`);
export { audit as solubilityAudit };
