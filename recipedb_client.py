import os
from pathlib import Path
import requests
from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parent / ".env")


class RecipeDBError(RuntimeError):
    """Raised when a RecipeDB request cannot be completed."""


class RecipeDBClient:
    def __init__(self):
        self.base_url = os.getenv(
            "RECIPEDB_BASE_URL",
            "http://cosylab.iiitd.edu.in:6969",
        ).rstrip("/")

        self.api_key = os.getenv("RECIPEDB_API_KEY", "").strip()

        if not self.api_key or self.api_key in {"PASTE_YOUR_API_KEY_HERE", "YOUR_REAL_API_KEY"}:
            raise RecipeDBError(
                "RECIPEDB_API_KEY is missing. "
                "Create a .env file and put your RecipeDB API key in it."
            )

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _get(self, path, params=None):
        url = f"{self.base_url}{path}"

        try:
            response = requests.get(
                url,
                headers=self._headers(),
                params=params,
                timeout=20,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            raise RecipeDBError(f"Request failed: {exc}") from exc

        try:
            return response.json()
        except ValueError as exc:
            raise RecipeDBError(
                "RecipeDB returned a response that was not valid JSON."
            ) from exc

    def search_by_title(self, title, max_results=50):
        """Search by title and collect up to max_results across API pages."""
        # The dedicated title endpoint documents only `title` and returns ten
        # results. RecipeDB's advanced search supports title, page, and limit.
        path = "/recipe2-api/recipebyingredient/by-ingredients-categories-title"
        recipes = []
        seen_ids = set()
        first_response = None
        page = 1
        page_size = min(10, max_results)

        while len(recipes) < max_results:
            # RecipeDB rejects limits above ten, so request successive pages.
            response = self._get(
                path,
                params={"title": title, "page": page, "limit": page_size},
            )
            if not isinstance(response, dict):
                raise RecipeDBError("RecipeDB returned an unexpected search response.")
            payload = response.get("payload")
            result = payload if isinstance(payload, dict) else response
            if not isinstance(result.get("data"), list):
                raise RecipeDBError("RecipeDB returned an unexpected search response.")

            if first_response is None:
                first_response = response

            added = 0
            for recipe in result["data"]:
                recipe_id = recipe.get("Recipe_id")
                if recipe_id in seen_ids:
                    continue
                seen_ids.add(recipe_id)
                recipes.append(recipe)
                added += 1
                if len(recipes) == max_results:
                    break

            pagination = result.get("pagination") or response.get("meta") or {}
            total_pages = pagination.get("totalPages")
            if (
                not result["data"]
                or added == 0
                or not pagination
                or (isinstance(total_pages, int) and page >= total_pages)
            ):
                break
            page += 1

        return {**first_response, "data": recipes}

    def get_recipe_by_id(self, recipe_id):
        """
        Fetch the complete raw recipe by Recipe_id.

        Endpoint from the supplied Postman collection:
        /recipe2-api/search-recipe/:id
        """
        return self._get(
            f"/recipe2-api/search-recipe/{recipe_id}"
        )
