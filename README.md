# SweetFix live RecipeDB demo

SweetFix searches RecipeDB by recipe title and shows up to 50 live matches. After you choose a recipe, it lists ingredients and instructions, flags possible sweetening ingredients, estimates the recipe category and heating process, and screens the local sweetener database. You can also choose to show the complete RecipeDB response.

## Run on Windows

1. Run `setup_windows.bat` once if the `venv` folder is missing.
2. Put your RecipeDB API key in `.env` as `RECIPEDB_API_KEY=...`.
3. Run `run_windows.bat`.
4. Enter a recipe name, such as `Cake`, then choose a match. Confirm whether the replacement sweetener will be baked, heated, added without heat, or whether that is unknown. Type `y` at the final prompt if you want to see the full API response.

`.env` and `venv` stay on your computer and are ignored by Git.

## Ingredient check

RecipeDB provides an `ingredient_Phrase` (such as `1 cup sugar`) and an ingredient name for each item. SweetFix shows the phrase and checks the name against common sweetening terms. For example, a cake with sugar and brown sugar shows both original ingredient lines and the terms that matched. The instructions are shown below the ingredient check.

The ingredient check uses a short list of common terms. A recipe with no matches is not necessarily sugar-free.

## Category and temperature screen

`recipe_classifier.py` uses the title and instruction words to estimate a food category and heating process. The program asks you to confirm how **the replacement sweetener itself** will be used. For example, choose `n` for frosting added after a cake is baked. This choice is important because oven temperature is not the same as the temperature of every ingredient.

`data/SweetFix_Database_Final.xlsx` is the original research workbook. `data/sweeteners.json` contains its 72 records needed by the live app. `data/heat_findings.json` adds the online heat research, with tested conditions and source links keyed by sweetener ID. The program combines both files when it runs. The original workbook remains unchanged so its earlier entries can be compared with the new findings; the app needs no spreadsheet library.

`sweetener_filter.py` gives each database ID one of four outcomes:

- **Excluded:** `SW001` is the sucrose reference. For baking, `SW020` (aspartame) is excluded by its workbook heat note and `SW058` (native monellin) by the newly linked heating study.
- **Provisional heat candidate:** the heat note explicitly says the substance is heat stable and suitable for baking and hot processing; currently `SW019` and `SW024`. This is only a temperature screen. New milk processing data hold `SW023` (neotame) for review rather than passing it automatically.
- **Needs review:** the available data do not match the recipe's actual time, temperature, acidity, and food matrix. The app prints every held ID.
- **No heat exclusion applied:** for a no-heat use, heat stability does not eliminate an alternative. Other checks are still required.

The online research pass on 22 October 2026 found new direct or contextual evidence for 40 of the 72 IDs. For the remaining IDs, the program reports that this pass found no additional matched study; it keeps their previous workbook note. Type any ID at the new inspection prompt to see its original note, new finding, evidence type, and source links. Some findings concern commercial extracts, fruit pulp, or storage rather than a purified sweetener in a baked recipe. Melting temperature and dry-powder decomposition are not interchangeable with sweetness retention in food.

The database has `NR`, inferred, retained, and matrix-specific heat entries. The program does not turn these into hard temperature limits. The categories are estimates, so check the recipe instructions and choose the correct heat exposure. No result is a finished blend, dose, taste assessment, medical claim, or confirmation that a sweetener is permitted for your location and food category.
