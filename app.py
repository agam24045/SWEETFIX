import json
from recipedb_client import RecipeDBClient, RecipeDBError


def main():
    print("=" * 60)
    print("SWEETFIX - WEEK 1 RECIPE FETCHER")
    print("=" * 60)

    recipe_name = input("\nEnter recipe name: ").strip()

    if not recipe_name:
        print("Please enter a recipe name.")
        return

    try:
        client = RecipeDBClient()
        print(f"\nSearching RecipeDB for: {recipe_name}")
        search_response = client.search_by_title(recipe_name)

        # According to the supplied RecipeDB Postman collection,
        # title-search results are returned in the top-level "data" list.
        recipes = search_response.get("data", [])

        if not recipes:
            print("\nNo matching recipes were found.")
            print("\nRaw RecipeDB response:")
            print(json.dumps(search_response, indent=2))
            return

        print(f"\nMatching recipes ({len(recipes)} shown):\n")

        for number, recipe in enumerate(recipes, start=1):
            recipe_id = recipe.get("Recipe_id", "Unknown")
            title = recipe.get("Recipe_title", "Unknown title")
            print(f"{number}. {title}  [Recipe ID: {recipe_id}]")

        choice_text = input("\nEnter the number of the recipe to fetch: ").strip()

        try:
            choice = int(choice_text)
        except ValueError:
            print("Please enter a valid number.")
            return

        if choice < 1 or choice > len(recipes):
            print("That selection is outside the available range.")
            return

        selected = recipes[choice - 1]
        recipe_id = selected.get("Recipe_id")

        if not recipe_id:
            print("The selected search result does not contain a Recipe_id.")
            return

        print(f"\nFetching full recipe for Recipe ID {recipe_id}...")

        full_recipe = client.get_recipe_by_id(recipe_id)

        print("\n" + "=" * 60)
        print("RAW RECIPE FETCHED SUCCESSFULLY")
        print("=" * 60)

        # Week 1 stops here: no parsing, no sugar detection,
        # no sweetener database use, and no recommendation logic.
        print(json.dumps(full_recipe, indent=2))

    except RecipeDBError as error:
        print("\nRecipeDB error:")
        print(error)


if __name__ == "__main__":
    main()
