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

        if not self.api_key or self.api_key in {
            "PASTE_YOUR_API_KEY_HERE", "YOUR_REAL_API_KEY"
        }:
            raise RecipeDBError(
                "RECIPEDB_API_KEY is missing. "
                "Create a .env file and put your RecipeDB API key in it."
            )

    def _headers(self):
        return {"Authorization": f"Bearer {self.api_key}"}

    def _get(self, path, params=None):
        url = f"{self.base_url}{path}"

        try:
            response = requests.get(
                url,
                headers=self._headers(),
                params=params,
                timeout=30,
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
        """Search recipe titles, ten results at a time."""
        path = "/recipe2-api/recipebyingredient/by-ingredients-categories-title"
        recipes = []
        seen_ids = set()

        for page in range(1, (max_results + 9) // 10 + 1):
            response = self._get(path, {"title": title, "page": page, "limit": 10})
            matches = response.get("data") if isinstance(response, dict) else None
            if not isinstance(matches, list):
                raise RecipeDBError("RecipeDB returned an unexpected search response.")

            for recipe in matches:
                recipe_id = recipe.get("Recipe_id")
                if recipe_id in seen_ids:
                    continue
                seen_ids.add(recipe_id)
                recipes.append(recipe)
                if len(recipes) == max_results:
                    break

            total_pages = response.get("meta", {}).get("totalPages")
            if not matches or len(recipes) == max_results or (total_pages and page >= total_pages):
                break

        return recipes

    def get_recipe_by_id(self, recipe_id):
        """Fetch the full RecipeDB response for one recipe."""
        return self._get(f"/recipe2-api/search-recipe/{recipe_id}")
