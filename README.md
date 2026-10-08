# SweetFix

SweetFix is a BTech project exploring sweetener recommendations. The implemented code currently covers the first stage: fetching a recipe from RecipeDB. It does not yet analyze ingredients or recommend sweeteners.

## Current flow

1. Enter a recipe name.
2. Search RecipeDB by title with its paginated advanced-search endpoint, collect up to 50 matches in pages of 10, and choose one.
3. Fetch the selected recipe by `Recipe_id`.
4. Print the complete raw JSON response.

The [SweetFix research workbook](data/SweetFix_Database_Solubility_Corrected.xlsx) is included for later stages. It contains the project's latest local solubility corrections and evidence notes. Its values and structure remain subject to change. Week 1 code does not read it. See [data notes](data/README.md).

## Run on Windows

From this folder, create a virtual environment and install the dependencies:

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and add your own RecipeDB API key. `.env` is ignored by Git. Then run:

```powershell
python app.py
```

The included `setup_windows.bat` and `run_windows.bat` offer a command prompt workflow.

## Show the flow without an API key

Run `demo_offline.bat`, enter `Cake`, and choose `50`. The demo shows 50 sample matches across five simulated API pages, then fetches the selected sample recipe through the actual app and client code. It makes no RecipeDB request. Use `run_windows.bat` with a real key to show live data.

## Offline checks

```powershell
python -m unittest -v
```

The tests mock RecipeDB, so they do not need an API key or network access. A live recipe fetch requires a valid key and access to the RecipeDB server.

## Next stages

Ingredient parsing, sugar detection, database integration, filtering, scoring, and recommendations are future work. [Week 1 notes](WEEK1_PRESENTATION_NOTES.md) describe the current implementation. The research workbook is not a validated source of medical or nutrition advice.
