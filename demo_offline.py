"""Interactive SweetFix Week 1 demo using sample RecipeDB responses.

This exercises the real app and client code without making network requests.
"""

import os
from unittest.mock import patch

os.environ["RECIPEDB_API_KEY"] = "offline-demo-only"

import app  # noqa: E402 - the demo key must be set before app is imported


SAMPLE_RECIPES = [
    {
        "Recipe_id": f"demo-{number:03}",
        "Recipe_title": f"Chocolate Cake Sample {number:02}",
        "ingredients": ["flour", "sugar", "cocoa powder"],
    }
    for number in range(1, 51)
] + [
    {
        "Recipe_id": "demo-101",
        "Recipe_title": "Lemonade (sample)",
        "ingredients": ["lemon juice", "water", "sugar"],
    },
]


class DemoResponse:
    def __init__(self, payload):
        self.payload = payload

    def raise_for_status(self):
        pass

    def json(self):
        return self.payload


def sample_get(url, *, params=None, **_kwargs):
    if url.endswith("/recipebyingredient/by-ingredients-categories-title"):
        query = (params or {}).get("title", "").casefold()
        matches = [
            {"Recipe_id": recipe["Recipe_id"], "Recipe_title": recipe["Recipe_title"]}
            for recipe in SAMPLE_RECIPES
            if query in recipe["Recipe_title"].casefold()
        ]
        page_size = 10
        page = int((params or {}).get("page", 1))
        start = (page - 1) * page_size
        return DemoResponse(
            {
                "data": matches[start : start + page_size],
                "meta": {
                    "totalPages": (len(matches) + page_size - 1) // page_size,
                    "limit": page_size,
                },
            }
        )

    for recipe in SAMPLE_RECIPES:
        if url.endswith(f"/search-recipe/{recipe['Recipe_id']}"):
            return DemoResponse(recipe)

    raise ValueError(f"Unexpected demo request: {url}")


if __name__ == "__main__":
    print("OFFLINE DEMO - SAMPLE DATA ONLY; NO RECIPEDB REQUEST IS MADE")
    print("Type Cake to see 50 sample matches, then select 50.")
    print("You can also type Lemonade to see one sample match.\n")
    with patch("recipedb_client.requests.get", side_effect=sample_get):
        app.main()
