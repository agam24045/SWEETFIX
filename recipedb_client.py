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

    def search_by_title(self, title):
        """
        Search RecipeDB by recipe title.

        Endpoint from the supplied Postman collection:
        /recipe2-api/recipe-bytitle/recipeByTitle?title=...
        """
        return self._get(
            "/recipe2-api/recipe-bytitle/recipeByTitle",
            params={"title": title},
        )

    def get_recipe_by_id(self, recipe_id):
        """
        Fetch the complete raw recipe by Recipe_id.

        Endpoint from the supplied Postman collection:
        /recipe2-api/search-recipe/:id
        """
        return self._get(
            f"/recipe2-api/search-recipe/{recipe_id}"
        )
