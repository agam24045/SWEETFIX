import re


SWEETENING_TERMS = (
    "brown sugar",
    "powdered sugar",
    "confectioners sugar",
    "icing sugar",
    "coconut sugar",
    "maple syrup",
    "corn syrup",
    "golden syrup",
    "agave nectar",
    "sugar",
    "honey",
    "syrup",
    "jaggery",
    "molasses",
    "treacle",
    "stevia",
    "dextrose",
    "fructose",
)


def extract_recipe(response):
    """Pick out the fields used in the demo from a RecipeDB detail response."""
    data = response.get("data", {}) if isinstance(response, dict) else {}
    if not isinstance(data, dict):
        data = {}

    recipe = data.get("recipe") or {}
    if not isinstance(recipe, dict):
        recipe = {}

    raw_ingredients = data.get("ingredients")
    if not isinstance(raw_ingredients, list):
        raw_ingredients = []

    ingredients = []
    for item in raw_ingredients:
        if isinstance(item, dict):
            name = str(item.get("ingredient") or "").strip()
            text = str(item.get("ingredient_Phrase") or name).strip()
        elif isinstance(item, str):
            name = text = item.strip()
        else:
            continue

        if text:
            ingredients.append({"name": name or text, "text": text})

    raw_instructions = data.get("instructions")
    if not isinstance(raw_instructions, list):
        raw_instructions = []

    instructions = []
    for item in raw_instructions:
        if isinstance(item, dict):
            text = item.get("steps") or item.get("instruction") or ""
        elif isinstance(item, str):
            text = item
        else:
            continue

        if str(text).strip():
            instructions.append(str(text).strip())

    return {
        "id": recipe.get("Recipe_id"),
        "title": recipe.get("Recipe_title") or "Untitled recipe",
        "ingredients": ingredients,
        "instructions": instructions,
    }


def find_sweetening_ingredients(ingredients):
    """Return listed ingredients that match a common sweetening term."""
    matches = []
    for item in ingredients:
        name = item["name"].casefold()
        if "sugar-free" in name or "sugar snap pea" in name:
            continue

        for term in SWEETENING_TERMS:
            if re.search(rf"\b{re.escape(term)}\b", name):
                matches.append({"text": item["text"], "term": term})
                break

    return matches
