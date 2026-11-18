# Original sweetener (OS) numerical research

The latest data are in `data/SweetFix_Database_Expanded.xlsx`. Open `OS_Numeric_Values` for 125 numerical records spanning all 22 OS IDs. Each record identifies a particular food, chemical form, regulatory grade, study sample, or labelled product; it includes the unit, conditions, source ID, and interpretation. `Sources` contains the source links. `Evidence_Log` has one row for every combination of 22 OS IDs and 21 main properties (462 checks).

## Parameter-by-parameter audit

| Main parameter | What the research can establish | Why one number is not entered for every OS ID |
| --- | --- | --- |
| Relative sweetness | Existing pure-compound comparisons for sucrose, fructose and maltose | Sensory ratio changes with concentration, acidity, temperature and food matrix; most OS products are mixtures. |
| Solubility | PubChem reference examples: sucrose 200 g/100 mL at 25°C and maltose 780 g/L at 20°C | The solid form and temperature must be specified; a syrup is already a solution. |
| Bulk density / specific gravity | Pure sucrose true density 1.5805 g/cm³ at 17°C | True crystal density differs from loose powder bulk density and syrup specific gravity. |
| Freezing point effect | Existing ideal calculations for specified pure sugars | This is a recipe-solution outcome, depending on all dissolved molecules and concentrations. |
| Browning | Chemical classification of reducing versus nonreducing sugars | A numerical browning rate needs a defined food, protein content, pH, temperature and time. |
| Heat stability | Existing conditional evidence and a few process observations | No single maximum temperature describes chemical change across dry and wet foods. |
| pH stability | Existing qualitative chemical notes | A stability window needs a chosen pH, temperature, time, concentration and endpoint. |
| Crystallization | Existing pure-compound behavior | Rate depends on supersaturation, seeding, agitation and impurities. |
| Hygroscopicity / equilibrium RH | Existing form-specific pure-compound references | Humidity behavior changes with water content, crystal form and temperature. |
| Fermentability | An existing fructose yeast-study observation | Microbe, medium, dose and observation time must be defined. |
| Cooling effect / heat of solution | Existing pure-compound enthalpy references | A dissolved syrup has no comparable dry-powder dissolution step. |
| Aftertaste | Qualitative sensory descriptions only | This is not a universal numerical physicochemical constant; a panel and scale are needed. |
| Melting point | Existing pure-compound references; maltose monohydrate 102–103°C | Mixed sugars and syrups do not have a single molecular melting point; hydrated and anhydrous forms differ. |
| Glass transition temperature | Acacia honey study sample: −17.12°C | Strongly dependent on moisture and composition. |
| Viscosity | Acacia honey study sample: 65.12 Pa·s | Strongly dependent on temperature, water content, concentration and shear method. |
| Water activity | One study honey sample 0.56; one agave sample 0.64 | Each marketed formulation and temperature can differ. |
| Norrish constant | Existing pure-sugar proxy values | A blended syrup does not have a single component's constant. |
| Calories | USDA food records and named manufacturer labels, with product-specific kcal/100 g | Water and non-sugar solids change energy per gram between products. |
| Glycemic index | Sample studies for coconut sugar, kaong palm sugar, honeys and agave; existing pure-sugar references | A human GI requires a test food, reference, protocol and participants; one study result does not describe every product. |
| Laxative threshold | No defensible common numerical threshold entered | A threshold depends on dose, person, product, and study endpoint. |
| ADI | Existing regulatory and category notes | Conventional sugar ingredients do not automatically have a numerical additive ADI; do not invent one. |

The numeric sheet additionally contains composition fields such as sucrose, glucose, fructose, moisture and total sugars. These are directly useful for identifying the original sweetener and eventually estimating its nutrient contribution, but the live program does not yet calculate a replacement dose or blood-glucose outcome.

## Key primary sources

- [USDA FoodData Central SR Legacy CSV archive](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip): food-specific energy, water and sugar composition; each numeric record includes its FDC ID.
- [PubChem sucrose](https://pubchem.ncbi.nlm.nih.gov/compound/sucrose), [D-glucose](https://pubchem.ncbi.nlm.nih.gov/compound/Anhydrous-Dextrose), [D-fructose](https://pubchem.ncbi.nlm.nih.gov/compound/D-fructose), [maltose](https://pubchem.ncbi.nlm.nih.gov/compound/maltose): pure-molecule identities and physical-property entries.
- [Codex Standard for Sugars](https://www.fao.org/fao-who-codexalimentarius/sh-proxy/en/?lnk=1&url=https%3A%2F%2Fworkspace.fao.org%2Fsites%2Fcodex%2FStandards%2FCXS+212-1999%2FCXS_212e.pdf), [Codex Standard for Honey](https://www.fao.org/input/download/standards/310/cxs_012e.pdf), [FSSAI jaggery standard](https://www.fssai.gov.in/upload/uploadfiles/files/Chapter%202_8%20%28Sweetening%20agents%20including%20Honey%29.pdf): grade-specific minimums and maximums.
- [Indigenous sugars composition and GI study in APJCN proceedings](https://apjcn.qdu.edu.cn/2018-0164-final.pdf), [US honey GI study](https://pubmed.ncbi.nlm.nih.gov/16863724/), [honey/agave water activity study](https://pmc.ncbi.nlm.nih.gov/articles/PMC5816588/), [honey rheology study](https://pmc.ncbi.nlm.nih.gov/articles/PMC8642391/): measured samples with stated protocols.

These sources were reviewed for numerical examples. The search is not a claim that every published paper or every commercial product was examined. A missing universal value is an explicit research result, not a zero.
