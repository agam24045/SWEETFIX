import json
import textwrap

from recipedb_client import RecipeDBClient, RecipeDBError
from recipe_analysis import extract_recipe, find_sugar_ingredients
from recipe_classifier import heating_temperatures, infer_sweetener_heat, recipe_category
from disease_filter import load_disease_rules, remaining_candidates, screen_conditions
from sweetener_filter import load_sweeteners, screen_sweeteners, temperature_review_sweeteners


def show_screen(filtered, heated):
    if not heated:
        print("\nNo heat: no sweeteners filtered because of heat.")
    else:
        print("\nHeat: sweeteners filtered out:")
        if filtered:
            for item in filtered:
                if item["filter_reason"] == "temperature_limit":
                    print(f"- {item['id']} | {item['name']} (recipe setting above {item['max_stable_c']:g} °C)")
                else:
                    print(f"- {item['id']} | {item['name']}")
        else:
            print("None")


def ask_conditions(conditions):
    while True:
        try:
            answer = input("\nDo you have any of the listed diagnosed conditions? (y/n): ").strip().lower()
        except EOFError:
            return None
        if answer in {"n", "no"}:
            return []
        if answer in {"y", "yes"}:
            break
        print("Please type y or n.")

    print("\nSelect all that apply:")
    for number, condition in enumerate(conditions, start=1):
        print(f"{number:>2}. {condition}")
    while True:
        try:
            answer = input("Enter numbers separated by commas (or 0 to skip): ").strip()
        except EOFError:
            return None
        if answer == "0":
            return []
        try:
            numbers = [int(part.strip()) for part in answer.split(",")]
        except ValueError:
            numbers = []
        if numbers and all(1 <= number <= len(conditions) for number in numbers):
            return [condition for number, condition in enumerate(conditions, start=1) if number in numbers]
        print(f"Use numbers from 1 to {len(conditions)}, separated by commas.")


def show_condition_screen(selected, result):
    if selected is None:
        print("\nCondition screen skipped.")
        return
    if not selected:
        print("\nNo conditions selected; no condition-based exclusions applied.")
        return

    print("\nCondition-based screen:")
    print(f"Selected: {', '.join(selected)}")
    original = [item for item in result["removed"] if item["id"] == "SW001"]
    if original:
        print("Original sugar in this recipe is flagged:")
        for item in original:
            print(f"- {item['id']} | {item['name']} ({', '.join(item['actions'])})")

    replacements = [item for item in result["removed"] if item["id"] != "SW001"]
    print("Removed from possible replacement sweeteners:")
    if replacements:
        for item in replacements:
            print(f"- {item['id']} | {item['name']} ({', '.join(item['actions'])})")
    else:
        print("None")

    kept = result["notes"]["NO AUTO BLOCK"]
    if kept:
        print("Not removed (NO AUTO BLOCK):")
        for item in kept:
            print(f"- {item['id']} | {item['name']}")
    print("LIMIT, REVIEW, CAUTION, and SOFT PENALTY are conservative demo removals, not clinical bans.")
    print("Other recipe ingredients and doses are not checked by this screen.")


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

        print("\nPlain table sugar in this recipe:")
        matches = find_sugar_ingredients(recipe["ingredients"])
        if matches:
            for match in matches:
                print(f"- {match['name']} | listed amount: {match['amount']}")
                print(f"  RecipeDB line: {match['text']}")
            print("Amounts are copied from ingredient lines; no unit conversion or replacement dose is calculated.")
        elif not recipe["ingredients"]:
            print("Cannot check because RecipeDB returned no ingredient list.")
        else:
            print("No plain table sugar or sucrose matched the listed ingredients.")

        print("\nInstructions:")
        if recipe["instructions"]:
            for number, step in enumerate(recipe["instructions"], start=1):
                print(textwrap.fill(step, width=88, initial_indent=f"{number}. ", subsequent_indent="   "))
        else:
            print("No instructions were returned.")

        print(f"\nRecipe category: {recipe_category(recipe)}")

        if matches:
            sweeteners = load_sweeteners()
            rule_data = load_disease_rules()
            selected_conditions = ask_conditions(rule_data["conditions"])
            condition_result = screen_conditions(selected_conditions or [], sweeteners, rule_data)
            show_condition_screen(selected_conditions, condition_result)

            heat_result = infer_sweetener_heat(recipe)
            if heat_result["heated"] is None:
                print(f"\nSweetener heat: Unclear ({heat_result['reason']}). Applying the heat screen conservatively.")
            else:
                answer = "Yes" if heat_result["heated"] else "No"
                print(f"\nSweetener heat: {answer} ({heat_result['reason']}).")

            heated_for_screen = heat_result["heated"] is not False
            recipe_temperature_c = None
            if heated_for_screen:
                settings = heating_temperatures(recipe)
                if settings:
                    highest = max(settings, key=lambda setting: setting["celsius"])
                    recipe_temperature_c = highest["celsius"]
                    print(f"Highest stated {highest['kind']}: {recipe_temperature_c:g} °C")
                    print("This is a cooking setting, not the measured sweetener temperature.")
                else:
                    print("No cooking temperature with °C or °F was found in the instructions.")
            heat_filtered = screen_sweeteners(heated_for_screen, sweeteners, recipe_temperature_c)
            show_screen(heat_filtered, heated_for_screen)
            if heated_for_screen and recipe_temperature_c is not None:
                for item in temperature_review_sweeteners(recipe_temperature_c, sweeteners):
                    print(f"Review {item['id']} | {item['name']}: {item['temperature_review_note']}")
            if selected_conditions is not None:
                remaining = remaining_candidates(sweeteners, heat_filtered, condition_result)
                print(f"Entries left for later recommendation scoring: {len(remaining)} (not final recommendations).")
        else:
            print("Replacement screen skipped because plain table sugar was not found.")

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
