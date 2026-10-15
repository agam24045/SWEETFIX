# SweetFix live RecipeDB demo

SweetFix searches RecipeDB by recipe title and shows up to 50 live matches. After you choose a recipe, it lists the ingredients and instructions and flags possible sweetening ingredients by name. You can also choose to show the complete RecipeDB response.

## Run on Windows

1. Run `setup_windows.bat` once if the `venv` folder is missing.
2. Put your RecipeDB API key in `.env` as `RECIPEDB_API_KEY=...`.
3. Run `run_windows.bat`.
4. Enter a recipe name, such as `Cake`, then choose a match. Type `y` at the final prompt if you want to see the full API response.

`.env` and `venv` stay on your computer and are ignored by Git.

## Ingredient check

RecipeDB provides an `ingredient_Phrase` (such as `1 cup sugar`) and an ingredient name for each item. SweetFix shows the phrase and checks the name against common sweetening terms. For example, a cake with sugar and brown sugar shows both original ingredient lines and the terms that matched. The instructions are shown below the ingredient check.

The ingredient check uses a short list of common terms. A recipe with no matches is not necessarily sugar-free. Sweetener recommendations and substitution amounts are future work.
