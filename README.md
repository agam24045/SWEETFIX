# SweetFix: recipe, condition, and heat demo

SweetFix searches RecipeDB for up to 50 recipe titles. After you choose a recipe, it shows the ingredients and instructions, finds plain table sugar (sucrose), and labels the recipe **Baked**, **Cooked**, **Beverage**, or **Other**. For a recipe with plain sugar, it asks whether you have any conditions in the supplied disease-rule list. It then checks the recipe instructions automatically to estimate whether a replacement sweetener used where the sugar appears would be heated. When a cooking temperature is stated, it converts Fahrenheit to Celsius and uses the highest stated setting for the heat screen.

## Run it on Windows

1. Open this `SweetFix` project folder.
2. Check that `.env` contains your `RECIPEDB_API_KEY`. If the `venv` folder is missing, run `setup_windows.bat` once.
3. Double-click `run_windows.bat`.
4. Search for a recipe and choose a result containing plain sugar. Answer `n` if none of the listed diagnosed conditions applies. If you answer `y`, enter one or more numbers from the displayed list, separated by commas.
5. Read the automatic heat result and condition-based removals. You can type `y` at the last prompt to see the full RecipeDB response.

The category is a simple label based on the recipe title and instructions. A beverage stays **Beverage** even if a syrup is boiled. A no-bake dessert is **Other** unless its instructions include another cooking step. Heat is inferred separately from the order of sugar, cooking, and cooling steps.

## Condition rules

The 82 rules for 38 conditions were transcribed from `SweetFix_Disease_Rules.pdf` into `data/disease_rules.json`. For this project demo, selecting a condition removes its linked sweetener entries from the possible replacement pool when the PDF action is **BLOCK**, **LIMIT**, **REVIEW**, **CAUTION**, or **SOFT PENALTY**. This is a conservative project rule: those latter four actions are not medical bans in the source document. **NO AUTO BLOCK** does not remove an entry unless another selected condition has a removal rule for it. The app has no dose or personal tolerance calculation. It also flags plain sugar already present in the recipe when a selected condition affects sucrose. The two erythritol blend entries inherit erythritol condition rules.

The condition screen checks sweetener entries, not all recipe ingredients or packaged-product ingredients. Its remaining-entry count is the pool left for later recommendation scoring; it is not a list of safe or recommended choices. For a diagnosed condition, use the result with your clinician or dietitian's advice. No condition answer is saved.

## Automatic heat check

- **Yes:** sugar is added before or during cooking, or the recipe is baked. The heat screen removes `SW020` aspartame and `SW058` native monellin. A verified maximum stability temperature can remove another entry when exceeded.
- **No:** the instructions show no heating step, or sugar is added after cooking and cooling. No sweetener is removed because of heat.
- **Unclear:** the instructions are missing or do not establish when the sugar is heated. The heat screen is applied conservatively, and the output says why.

The current database has **no general numerical maximum stability temperature for the replacement sweeteners**. A note such as `>160 °C` means stability extends beyond 160 °C; 160 °C is not a cutoff. A temperature at which a sample was tested is not automatically a cutoff either. For example, the 119 °C dry-powder decomposition result for `SW021` sucralose appears as a **review note** above that setting, not an automatic food-recipe exclusion. The recipe's oven setting is also not the measured temperature inside its sweetener.

The check assumes the replacement sweetener is added where the recipe uses plain sugar. For example, if instructions say to cool a cake completely before adding sugar to cold frosting, the result is **No**. Recipe instructions can be incomplete, so the result is an estimate rather than a measured sweetener temperature.

The app only looks for plain sugar, white sugar, granulated sugar, caster sugar, superfine sugar, table sugar, or sucrose. It does not trigger the screen for honey, jaggery, brown sugar, syrups, fruit, or sugar substitutes. It copies any written sugar amount from the ingredient line; it does not calculate a replacement amount.

This is only a simple heat screen. The sweeteners not removed still need checks for taste, dose, recipe function, and permitted use. `SW001` sucrose is the original sugar reference, not a replacement, and is not shown as a heat exclusion. Heat research notes are stored in `data/heat_findings.json` and `HEAT_RESEARCH.md`.

## Offline test

Open PowerShell in the demo folder and run:

```powershell
venv\Scripts\python.exe -m unittest -v test_sweetfix.py
```

The tests use a fake RecipeDB response and require no API key. They cover the four categories, all 82 condition-rule records, conservative condition removals, the **NO AUTO BLOCK** exception, automatic heat inference, combined heat and condition exclusions, Celsius/Fahrenheit parsing, and the dry-powder review note.

## Database and research files

The live demo reads `data/sweeteners.json` (65 SW entries plus seven extracts or blends), `data/heat_findings.json`, and `data/disease_rules.json`. The single-sheet 65-sweetener numeric database for submission is `submission/SweetFix_Final_Sweetener_Database.xlsx`. The live demo does not yet read that workbook or use its solubility, cooling, and other numeric properties for ranking.

`submission/SweetFix_Solubility_Audit_65.md` records sources and conditions for every solubility entry. `submission/SweetFix_Natural_Sweeteners.xlsx` is the separate original-sweetener research file. The scripts and source data under `_database_build/` reproduce the submission workbook; generated preview PNG files are excluded from Git.
