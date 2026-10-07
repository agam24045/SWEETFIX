# Week 1 presentation notes

## What I worked on

During Week 1, I focused only on establishing the connection between SweetFix and RecipeDB.

The aim was to make sure the program can retrieve a real recipe before implementing any recommendation logic.

## Current flow

```text
User enters recipe name
        ↓
SweetFix sends title to RecipeDB
        ↓
RecipeDB returns matching recipes
        ↓
Program displays those recipes
        ↓
User selects one
        ↓
Program obtains Recipe_id
        ↓
SweetFix fetches the complete recipe
        ↓
Raw JSON is displayed
```

## Files

### `app.py`

Controls the user interaction:
- accepts recipe name
- displays search results
- accepts selection
- prints the fetched recipe

### `recipedb_client.py`

Contains the RecipeDB API communication:
- search by title
- fetch by Recipe_id

### `.env`

Stores the API key locally.

### `requirements.txt`

Contains the Python packages required for the Week-1 program.

## What I have deliberately not done yet

The SweetFix Excel database is still a working draft. Its data and structure may
change. Week 1 does not depend on it, so those revisions do not affect the current
recipe-fetching flow. A later stage will load and validate the selected database
separately from the recommendation algorithm.

I have not started:
- parsing ingredients
- finding sugar
- converting quantities
- accessing the sweetener database
- ranking substitutes
- optimization

The goal of this first stage is simply to confirm that the project can reliably retrieve recipe data from RecipeDB.

## One-line explanation for the professor

"During the first week I implemented the data-acquisition layer of SweetFix: the system can search RecipeDB by recipe title, obtain the selected Recipe_id, and fetch the complete raw recipe response through the API."
