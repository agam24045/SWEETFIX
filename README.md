# SweetFix live RecipeDB demo

This demo searches RecipeDB by recipe title, shows up to 50 live matches, and fetches the full raw response for a selected recipe.

## Run on Windows

1. Run `setup_windows.bat` once if the `venv` folder is missing.
2. Put your RecipeDB API key in `.env` as `RECIPEDB_API_KEY=...`.
3. Run `run_windows.bat`.
4. Enter a recipe name, such as `Cake`, then enter the number of a match to fetch it.

`.env` and `venv` stay on your computer and are ignored by Git.

The code currently fetches recipes only; sweetener recommendations are future work.
