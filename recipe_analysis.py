import re


NUMBER = r"(?:\d+(?:\.\d+)?(?:\s+\d+/\d+|\s+[¼½¾⅓⅔⅛⅜⅝⅞])?|\d+/\d+|[¼½¾⅓⅔⅛⅜⅝⅞])"
UNIT = (
    r"(?:cups?|tablespoons?|tbsp\.?|teaspoons?|tsp\.?|grams?|g|kilograms?|kg|"
    r"millilit(?:er|re)s?|ml|lit(?:er|re)s?|l|ounces?|oz|pounds?|lbs?)"
)
AMOUNT = re.compile(rf"(?<!\w){NUMBER}(?:\s*(?:-|to)\s*{NUMBER})?\s*{UNIT}(?!\w)", re.I)
PLAIN_SUGAR = re.compile(r"\b(?:sugar|sucrose)\b", re.I)
OTHER_SUGAR = re.compile(
    r"\b(?:brown|powdered|confectioners'?|icing|coconut|palm|date|raw|cane|beet|"
    r"turbinado|demerara|muscovado|invert|corn|vanilla|maple)\s+sugar\b"
    r"|\b(?:sugar[ -]?free|no[ -]?(?:added[ -]?)?sugar|sugar snap peas?|sugar substitute|"
    r"sugar syrup|sugar cane|sugar alcohols?)\b",
    re.I,
)


def listed_amount(text):
    """Copy an explicit amount from a phrase; never infer grams of sugar."""
    found = [match.group(0).strip() for match in AMOUNT.finditer(text)]
    if len(found) == 1:
        return found[0]
    if len(found) > 1:
        return "multiple measures; see original line"
    return "not stated"


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


def find_sugar_ingredients(ingredients):
    """Find plain table sugar or sucrose, keeping the written ingredient amount."""
    matches = []
    for item in ingredients:
        phrase = str(item.get("text") or "")
        name = str(item.get("name") or "")
        searchable = (phrase or name).replace("’", "'")
        if OTHER_SUGAR.search(searchable) or OTHER_SUGAR.search(name):
            continue
        if PLAIN_SUGAR.search(searchable):
            matches.append({
                "text": phrase or name,
                "name": "Table sugar (sucrose)",
                "amount": listed_amount(phrase),
            })

    return matches
