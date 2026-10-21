import re


def _has(text, pattern):
    return bool(re.search(pattern, text, re.IGNORECASE))


def classify_recipe(recipe):
    """Estimate a recipe's food group and heat step from its title and instructions."""
    title = recipe.get("title", "")
    steps = " ".join(recipe.get("instructions", []))
    lower_steps = steps.casefold()

    if _has(title, r"\b(cake|cookie|biscuit|brownie|muffin|bread|pastry|pie|cupcake)\b"):
        category = "Baked goods"
    elif _has(title, r"\b(juice|lemonade|smoothie|milkshake|tea|coffee|latte|drink|cocktail)\b"):
        category = "Beverage"
    elif _has(title, r"\b(ice cream|sorbet|popsicle|frozen yogurt)\b"):
        category = "Frozen dessert"
    elif _has(title, r"\b(jam|jelly|marmalade|preserve)\b"):
        category = "Preserve"
    elif _has(title, r"\b(candy|toffee|fudge|caramel|syrup)\b"):
        category = "Confection or syrup"
    else:
        category = "Other / uncertain"

    # Instructions describe the process more directly than the recipe title.
    if _has(steps, r"\b(bake|baking|baked|preheat oven|put in (?:the )?oven)\b") and not _has(
        steps, r"\b(no[ -]?bake|without baking)\b"
    ):
        heat = "baking"
        evidence = "Baking or oven step found in the instructions"
    elif _has(steps, r"\b(boil|boiling|simmer|simmering|cook|cooking|heat|heated|melt|fry|roast|steam)\b"):
        heat = "hot"
        evidence = "Heating step found in the instructions"
    elif _has(steps, r"\b(chill|refrigerat\w*|freeze|blend|stir|mix|serve cold|no[ -]?bake)\b"):
        heat = "none"
        evidence = "Only cold or mixing steps found in the instructions"
    elif not lower_steps and category == "Baked goods":
        heat = "baking"
        evidence = "Inferred from the baked-good title; no instructions were returned"
    elif not lower_steps and category in {"Frozen dessert", "Beverage"}:
        heat = "unknown"
        evidence = "The title alone does not establish the temperature"
    else:
        heat = "unknown"
        evidence = "No clear temperature step was found"

    return {"category": category, "heat": heat, "evidence": evidence}
