"""Label the recipe and read any stated cooking temperatures."""

import re


BAKING = re.compile(r"\b(bake|baked|baking(?!\s+(?:soda|powder))|preheat\s+(?:the\s+)?oven|oven)\b", re.I)
HEATING = re.compile(r"\b(boil(?:ed|ing)?|simmer(?:ed|ing)?|cook(?:ed|ing)?|heat(?:ed|ing)?|melt(?:ed|ing)?|fr(?:y|ied|ying)|roast(?:ed|ing)?|steam(?:ed|ing)?)\b", re.I)
ACTIVE_BAKING = re.compile(r"\b(bake|baked|baking(?!\s+(?:soda|powder)))\b|\b(?:place|put|transfer|slide|return)\b.{0,60}\b(?:in|into|to)\s+(?:the\s+)?oven\b", re.I)
HOT_STATE = re.compile(r"\b(?:hot|warm|steaming)\b", re.I)
NO_BAKE = re.compile(r"\b(no[ -]?bake|without baking|do not bake|don't bake|no oven|without (?:an?\s+)?oven)\b", re.I)
NO_HEAT = re.compile(r"\b(?:do not|don't|no|without)\s+(?:heat(?:ing)?|cook(?:ing)?|boil(?:ing)?|simmer(?:ing)?|fry(?:ing)?)\b", re.I)
BEVERAGE_TITLE = re.compile(r"\b(juice|lemonade|smoothie|milkshake|tea|coffee|latte|drink|cocktail|mocktail|hot chocolate)\b", re.I)
BAKED_TITLE = re.compile(r"\b(cake|cookies?|biscuits?|brownies?|muffins?|bread|pastry|pastries|pies?|cupcakes?)\b", re.I)
TEMPERATURE = re.compile(r"(?<!\d)(\d{2,3}(?:\.\d+)?)\s*(?:°|degrees?\s*)?\s*(Celsius|Fahrenheit|[CF])\b", re.I)
SUGAR = re.compile(r"\b(?:sugar|sucrose)\b", re.I)
OTHER_SUGAR = re.compile(r"\b(?:brown|powdered|icing|coconut|palm|date|raw|cane|beet)\s+sugar\b|\bsugar[ -]?free\b", re.I)
COOLED = re.compile(r"\b(?:cool(?:ed)?\s+(?:completely|fully|to room temperature)|chill\w*|refrigerat\w*|cold|room temperature)\b", re.I)


def _steps(recipe):
    instructions = recipe.get("instructions") or []
    if isinstance(instructions, str):
        instructions = [instructions]
    return [str(step) for step in instructions if str(step).strip()]


def _clean(text):
    return NO_HEAT.sub("", NO_BAKE.sub("", text))


def _heat_step(text):
    clean = _clean(text)
    return bool(ACTIVE_BAKING.search(clean) or HEATING.search(clean) or HOT_STATE.search(clean))


def infer_sweetener_heat(recipe):
    """Estimate heat exposure when a substitute is used where plain sugar appears.

    Unknown cases are screened conservatively by the caller. This is based on
    instruction order, not on a measured temperature inside the sweetener.
    """
    steps = _steps(recipe)
    if not steps:
        return {"heated": None, "reason": "No instructions were returned"}

    clauses = [part.strip() for part in re.split(
        r"(?<=[.!?;])\s+|\bthen\b|,\s*(?=(?:cool|chill|refrigerate|add|mix|stir)\b)"
        r"|\band\s+(?=(?:let\s+)?(?:cool|chill|refrigerate)\b)",
        " ".join(steps), flags=re.I,
    ) if part.strip()]
    heat_positions = [index for index, clause in enumerate(clauses) if _heat_step(clause)]
    sugar_positions = [index for index, clause in enumerate(clauses)
                       if SUGAR.search(OTHER_SUGAR.sub("", clause))]

    if not heat_positions:
        title = str(recipe.get("title") or "")
        if any(BAKING.search(_clean(clause)) for clause in clauses) or (
            (BAKED_TITLE.search(title) or HOT_STATE.search(title))
            and not NO_BAKE.search(f"{title} {' '.join(steps)}")
        ):
            return {"heated": None, "reason": "The recipe suggests heat, but no cooking step is clear"}
        return {"heated": False, "reason": "No heating step found in the instructions"}

    if not sugar_positions:
        if any(ACTIVE_BAKING.search(_clean(clauses[index])) for index in heat_positions):
            return {"heated": True, "reason": "The recipe is baked"}
        return {"heated": None, "reason": "Cooking is shown, but the sugar timing is unclear"}

    for sugar_index in sugar_positions:
        if any(heat_index >= sugar_index for heat_index in heat_positions):
            return {"heated": True, "reason": "Sugar is added before or during heating"}
        last_heat = heat_positions[-1]
        if not any(COOLED.search(clause) for clause in clauses[last_heat + 1:sugar_index + 1]):
            return {"heated": None, "reason": "Sugar is added after cooking, but cooling is not clear"}

    return {"heated": False, "reason": "Sugar is added after cooking and cooling"}


def recipe_category(recipe):
    """Return one simple label for the recipe."""
    title = str(recipe.get("title") or "")
    steps = " ".join(_steps(recipe))
    no_bake = bool(NO_BAKE.search(f"{title} {steps}"))
    process = NO_BAKE.sub("", steps)

    if BEVERAGE_TITLE.search(title):
        return "Beverage"
    if BAKING.search(process) or (BAKED_TITLE.search(title) and not no_bake):
        return "Baked"
    if HEATING.search(process):
        return "Cooked"
    return "Other"


def _celsius(value, unit):
    number = float(value)
    return round((number - 32) * 5 / 9, 1) if unit.upper().startswith("F") else number


def heating_temperatures(recipe):
    """Read stated oven or cooking settings; these are not food temperatures."""
    instructions = _steps(recipe)
    has_baking = any(ACTIVE_BAKING.search(_clean(step)) for step in instructions)
    settings = []
    for step in instructions:
        text = str(step)
        clean = _clean(text)
        baking = bool(ACTIVE_BAKING.search(clean))
        if not (_heat_step(clean) or (has_baking and BAKING.search(clean))):
            continue
        kind = "oven setting" if baking or (has_baking and BAKING.search(clean)) else "cooking setting"
        for match in TEMPERATURE.finditer(text):
            settings.append({
                "celsius": _celsius(match.group(1), match.group(2)),
                "kind": kind,
                "written": match.group(0),
            })
    return settings
