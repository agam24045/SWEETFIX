import json
from recipedb_client import RecipeDBClient, RecipeDBError


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
        print("\nRecipeDB details:\n")
        print(json.dumps(full_recipe.get("data", full_recipe), indent=2, ensure_ascii=False))

    except RecipeDBError as error:
        print("\nRecipeDB error:")
        print(error)


if __name__ == "__main__":
    main()
