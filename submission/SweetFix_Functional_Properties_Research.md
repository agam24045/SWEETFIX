# SweetFix functional-property research

Scope: SW001–SW065 in the main sweetener database only. The separate natural-sweeteners workbook was not changed. The seven ING extracts/blends were excluded. SW010 isomalt remains because it is within the first 65 IDs; its Entity_Type correctly records it as a polyol mixture.

The single-sheet submission workbook is a numeric extract for code use. Sweetener_ID and Name are the only text identifiers. Every other data cell is a real number or the literal N/A. Narrative research values, identity links, source URLs, and conditional observations are kept in the full research JSON in _database_build and in these notes, not mixed into numeric property cells.

## Numeric workbook rules

- Units are in column names. N/A means no defensible single numeric value for that field, including missing data, most ranges, qualitative results, or condition-dependent observations. It never means zero. A regulatory ADI written 0–X is recorded as its upper limit X.
- Solubility_Approx_g_L_Water uses the separate 65-row solubility audit. It converts reported g/kg water to an approximate g/L water using 1 kg water ≈ 1 L; it omits upper/lower bounds, mixtures of forms, and values that are only stock concentrations. Source temperature, form, method and provisional status are in SweetFix_Solubility_Audit_65.md.
- Heat_Max_C is filled only for an explicit <X°C ceiling. Heat_Stable_Through_C is filled only for an explicit >X°C statement. A melting point, a stable test temperature, and a cooking temperature are not substitutes for a heat ceiling.
- Heat_Filter_Flag mirrors the current demo rule: 1 means the existing heat screen excludes that sweetener when heated; 0 means that particular rule does not exclude it, not that heat stability has been established. Heat_Review_C is a review trigger, not a hard safety limit.
- Cooling_Heat_of_Solution_J_g keeps the signed J/g value reported or converted in the research record. Cooling_Energy_at_Equal_Sweetness_J is a positive magnitude based on the sweetness-equivalent mass; it is not a sensory cooling score.
- ADI columns are separated by authority. ADI_Steviol_Equiv_mg_kg_day is in steviol-equivalent units and requires conversion before applying it to glycoside mass. No regulatory limit is inferred where the source says not specified.
- Reducing_Sugar_Flag is 1 for the identified reducing sugars and 0 for other listed entities. Yeast_Fermentability_Flag is 1 for the stated yeast consumption tests, 0 for the stated non-metabolism tests, and N/A otherwise. Crystallization_Observed_Flag reflects only the specific concentrated-solution tests; 0 for maltitol under that test is not a universal no-crystallization claim.

## Methods

- Bulking_Equivalent_g_per_100g_Sucrose = 100 / mass-relative sweetness. This is a sweetness-equivalent ingredient mass, not a prediction that it reproduces sugar's texture. Text potency ranges have their calculated mass range in Bulking_Basis; the numeric cell is blank.
- Cooling_Energy_at_Equal_Sweetness_J = absolute value of previously recorded dissolution heat in J/g times the calculated sweetness-equivalent mass. It is an ideal comparison of isolated dry ingredients dissolving under the cited test conditions, not a measured cooling sensation in a finished recipe. Hydrate-specific heats for trehalose, maltose and lactose were not multiplied by sweetness mass because the solid forms may differ. Source sign conventions differ; original signed values remain in Cooling_Effect_Heat_of_Solution.
- Browning_Potential identifies chemical roles. REDUCING SUGAR means possible Maillard browning with amino ingredients. NONREDUCING does not mean a baked food cannot brown. Proteins and some amino sweeteners can react with reducing sugars supplied elsewhere in the recipe.
- Moisture_Retention reports a dry-powder critical relative humidity or other stated moisture measurement where one was found. For high-intensity sweeteners, the low-bulk assessment follows from <=5 g per 100 g sucrose-equivalent sweetness; it is not a measured final-food water activity.
- Acid_Stability preserves pH, temperature, time, matrix and whether evidence is exact, a regulatory review, or a class proxy. A class proxy cannot be treated as a compound-specific heat or acid limit.
- Cooling_Use_Level_Assessment and Crystallization_Use_Assessment distinguish measured behaviour from low-mass inference. Neither gives a final-food result without recipe water, concentration and processing conditions.
- NR means no verified comparable value for the exact entity and conditions. It is not zero or evidence of instability. Published work rarely gives dissolution enthalpy, crystallization kinetics, or moisture sorption for the minor isolated glycosides and sweet proteins, so these cells stay explicit rather than guessed.
- The submission workbook contains numeric property values only, plus Sweetener_ID and Name. Research status and detailed conditions remain in the full research record and these notes.

## Coverage

- 65 IDs in the numeric workbook; 7 ING records excluded; 29 columns total. Water solubility: 33 selected numeric values and 32 N/A entries.
- 53 numerical bulking equivalents; 12 numerical equal-sweetness cooling comparisons.
- 23 exact/reviewed acid entries, 11 steviol-glycoside class proxies, and 31 acid entries without comparable evidence.
- 68 unique source links used in this update (some apply to a class or measurement protocol).

## Core sources

- candy: https://electronicsandbooks.com/edt/manual/Magazine/I/International%20Journal%20of%20Pharmaceutics/2004%20v.278/02%20%28209-484%29/447-457.pdf
- biscuits: https://pmc.ncbi.nlm.nih.gov/articles/PMC13256550/
- cake: https://pmc.ncbi.nlm.nih.gov/articles/PMC10533539/
- rareSugar: https://pubs.acs.org/doi/10.1021/acsfoodscitech.5c01202
- moisture: https://researchmgt.monash.edu/ws/portalfiles/portal/419168805/395773575_oa.pdf
- fsaIsomaltulose: https://www.foodstandards.gov.au/sites/default/files/food-standards-code/applications/Documents/DAR_A578_Isomaltulose.pdf
- efsaSteviol: https://pmc.ncbi.nlm.nih.gov/articles/PMC7448073/
- rebM: https://pmc.ncbi.nlm.nih.gov/articles/PMC3907853/
- steviolbioside: https://pmc.ncbi.nlm.nih.gov/articles/PMC5305715/
- monk: https://pmc.ncbi.nlm.nih.gov/articles/PMC7008860/
- siamenoside: https://ijpsr.com/bft-article/stability-of-monk-fruit-sweetener-siamenoside-i-under-acidic-and-thermal-conditions-and-its-degradation-products/?view=fulltext
- aceAsp: https://pmc.ncbi.nlm.nih.gov/articles/PMC3671041/
- sucralose: https://onlinelibrary.wiley.com/doi/10.2903/j.efsa.2026.9854
- saccharin: https://efsa.onlinelibrary.wiley.com/doi/full/10.2903/j.efsa.2024.9044
- neotame: https://pmc.ncbi.nlm.nih.gov/articles/PMC12231243/
- advantame: https://www.fsc.go.jp/english/evaluationreports/foodadditive/advantame_report.pdf
- alitame: https://pubchem.ncbi.nlm.nih.gov/compound/Alitame
- nhdc: https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2022.7595
- hernandulcin: https://patents.google.com/patent/US4808409A/en
- thaumatin: https://academic.oup.com/bbb/article-pdf/65/2/409/35022693/bbb0409.pdf
- thaumatinII: https://onlinelibrary.wiley.com/doi/pdfdirect/10.1111/j.1432-1033.1973.tb02872.x
- brazzein: https://patents.google.com/patent/US5527555A
- curculin: https://pubmed.ncbi.nlm.nih.gov/7583017/
- miraculin: https://pmc.ncbi.nlm.nih.gov/articles/PMC8193528/
- monoNeoculin: https://pmc.ncbi.nlm.nih.gov/articles/PMC4444330/
- fdaTrehalose: https://www.fda.gov/media/140635/download
- steviolFamily: https://pmc.ncbi.nlm.nih.gov/articles/PMC8826121/
- polyolCrystals: https://pmc.ncbi.nlm.nih.gov/articles/PMC10995941/
- isomaltMoisture: https://www.sciencedirect.com/science/article/pii/S0032591021006707
- lactitolMoisture: https://patents.google.com/patent/US5516763A/en
