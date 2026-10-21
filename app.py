import json
import textwrap

from recipedb_client import RecipeDBClient, RecipeDBError
from recipe_analysis import extract_recipe, find_sweetening_ingredients
from recipe_classifier import classify_recipe
from sweetener_filter import load_sweeteners, screen_sweeteners


def show_screen(results):
    excluded = results["excluded"]
    review = results["review"]
    candidates = results["candidate"]
    unscreened = results["unscreened"]

    total = sum(len(group) for group in results.values())
    print(f"\nDatabase temperature screen ({total} records):")
    print("This is a first filter, not a blend recommendation or use approval.")
    print(f"\nExcluded ({len(excluded)}):")
    for item in excluded:
        print(f"- {item['id']} | {item['name']}: {item['reason']}")
        if item["id"] != "SW001":
            print(f"  Workbook heat entry: {item['heat_stability']}")
            if item["research_level"] != "no_new_match":
                print(f"  New research: {item['research_note']}")

    if candidates:
        print(f"\nProvisional heat candidates ({len(candidates)}):")
        for item in candidates:
            print(f"- {item['id']} | {item['name']} (heat source: {item['heat_source_id'] or 'not listed'})")

    if review:
        print(f"\nNeeds process-specific review ({len(review)}):")
        ids = ", ".join(item["id"] for item in review)
        print(textwrap.fill(ids, width=88, initial_indent="  ", subsequent_indent="  "))
        print("These IDs are held back because the temperature exposure or matching evidence is unclear.")

    if unscreened:
        print(f"\nNo heat exclusion applied to {len(unscreened)} alternatives:")
        ids = ", ".join(item["id"] for item in unscreened)
        print(textwrap.fill(ids, width=88, initial_indent="  ", subsequent_indent="  "))

    print("Other checks, including permitted use, dose, taste, and recipe function, are still needed.")


def inspect_heat_evidence(sweeteners):
    by_id = {item["id"].upper(): item for item in sweeteners}
    while True:
        try:
            sweetener_id = input("\nInspect heat evidence for an ID (Enter to finish): ").strip().upper()
        except EOFError:
            return
        if not sweetener_id:
            return
        item = by_id.get(sweetener_id)
        if item is None:
            print("ID not found. Use an ID shown in the screen above.")
            continue

        print(f"\n{item['id']} | {item['name']}")
        print(f"Workbook heat note: {item['heat_stability']}")
        print(f"Workbook source ID: {item['heat_source_id'] or 'not listed'}")
        print(f"Research type: {item['research_level']}")
        print(textwrap.fill(item["research_note"], width=88))
        for source in item["research_sources"]:
            print(f"Source: {source}")


def main():
    print("\nSweetFix | Recipe search")

    recipe_name = input("Search for a recipe: ").strip()

    if not recipe_name:
        print("Please enter a recipe name.")
        return

    try:
        client = RecipeDBClient()
        print("\nSearching RecipeDB...\n")
        recipes = client.search_by_title(recipe_name)

        if not recipes:
            print("No matching recipes found.")
            return

        print(f"Found {len(recipes)} recipes for '{recipe_name}':\n")

        for number, recipe in enumerate(recipes, start=1):
            print(
                f"{number:>2}. {recipe.get('Recipe_title', 'Untitled recipe')} "
                f"(ID: {recipe.get('Recipe_id', 'N/A')})"
            )

        choice_text = input("\nChoose a recipe number: ").strip()

        try:
            choice = int(choice_text)
        except ValueError:
            print("Please enter a valid number.")
            return

        if not 1 <= choice <= len(recipes):
            print(f"Choose a number between 1 and {len(recipes)}.")
            return

        selected = recipes[choice - 1]
        recipe_id = selected.get("Recipe_id")

        if not recipe_id:
            print("The selected search result does not contain a Recipe_id.")
            return

        print(f"\nFetching {selected.get('Recipe_title', 'recipe')}...")

        full_recipe = client.get_recipe_by_id(recipe_id)
        recipe = extract_recipe(full_recipe)

        print(f"\n{recipe['title']} (ID: {recipe['id'] or recipe_id})")
        print("\nIngredients:")
        if recipe["ingredients"]:
            for ingredient in recipe["ingredients"]:
                print(f"- {ingredient['text']}")
        else:
            print("No ingredient list was returned.")

        print("\nPossible sweetening ingredients:")
        matches = find_sweetening_ingredients(recipe["ingredients"])
        if matches:
            for match in matches:
                print(f"- {match['text']} (matched: {match['term']})")
        elif not recipe["ingredients"]:
            print("Cannot check because RecipeDB returned no ingredient list.")
        else:
            print("No listed ingredient matched the current term list.")

        print("\nInstructions:")
        if recipe["instructions"]:
            for number, step in enumerate(recipe["instructions"], start=1):
                print(textwrap.fill(step, width=88, initial_indent=f"{number}. ", subsequent_indent="   "))
        else:
            print("No instructions were returned.")

        classification = classify_recipe(recipe)
        print(f"\nRecipe category: {classification['category']}")
        print(f"Estimated sweetener heat exposure: {classification['heat']}")
        print(f"Why: {classification['evidence']}")
        print("Check when the sweetener is added. Frosting added after baking, for example, is not baked.")
        choices = {"b": "baking", "h": "hot", "n": "none", "u": "unknown"}
        prompt = (
            "Heat exposure for the replacement "
            "[b=baked, h=heated, n=no heat, u=unknown; Enter=estimate]: "
        )
        try:
            answer = input(prompt).strip().lower()
        except EOFError:
            answer = ""
        if answer and answer not in choices:
            print("Unrecognized choice; using the estimate above.")
        heat = choices.get(answer, classification["heat"])
        print(f"Screening for: {heat}")
        sweeteners = load_sweeteners()
        show_screen(screen_sweeteners(heat, sweeteners))
        inspect_heat_evidence(sweeteners)

        try:
            show_full = input("\nShow the full RecipeDB response? (y/N): ").strip().lower()
        except EOFError:
            show_full = ""
        if show_full in {"y", "yes"}:
            print(json.dumps(full_recipe, indent=2, ensure_ascii=False))

    except RecipeDBError as error:
        print("\nRecipeDB error:")
        print(error)


if __name__ == "__main__":
    main()
