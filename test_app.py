"""Offline checks: python -m unittest -v"""

import contextlib
import io
import os
import unittest
from unittest.mock import Mock, patch

import app
from recipedb_client import RecipeDBClient, RecipeDBError


class RecipeFetcherTests(unittest.TestCase):
    def test_missing_and_placeholder_keys_are_rejected(self):
        for key in ("", "PASTE_YOUR_API_KEY_HERE", "YOUR_REAL_API_KEY"):
            with self.subTest(key=key), patch.dict(os.environ, {"RECIPEDB_API_KEY": key}):
                with self.assertRaises(RecipeDBError):
                    RecipeDBClient()

    def test_configuration_error_is_displayed_without_crashing(self):
        output = io.StringIO()
        with patch("builtins.input", return_value="Cake"), patch(
            "app.RecipeDBClient", side_effect=RecipeDBError("Missing key")
        ), contextlib.redirect_stdout(output):
            app.main()
        self.assertIn("Missing key", output.getvalue())

    def test_search_selection_and_raw_recipe_output(self):
        search = Mock()
        search.json.return_value = {
            "data": [{"Recipe_id": "123", "Recipe_title": "Cake"}]
        }
        detail = Mock()
        detail.json.return_value = {"Recipe_id": "123", "ingredients": ["flour"]}
        output = io.StringIO()
        with patch.dict(os.environ, {"RECIPEDB_API_KEY": "offline-test-key"}), patch(
            "recipedb_client.requests.get", side_effect=[search, detail]
        ) as get, patch("builtins.input", side_effect=["Cake", "1"]), contextlib.redirect_stdout(output):
            app.main()
        self.assertEqual(get.call_count, 2)
        self.assertEqual(
            get.call_args_list[0].kwargs["params"],
            {"title": "Cake", "page": 1, "limit": 50},
        )
        self.assertTrue(get.call_args_list[1].args[0].endswith("/search-recipe/123"))
        self.assertIn('"flour"', output.getvalue())
        self.assertIn("RAW RECIPE FETCHED SUCCESSFULLY", output.getvalue())

    def test_invalid_selection_does_not_fetch_recipe(self):
        with patch("app.RecipeDBClient") as client, patch(
            "builtins.input", side_effect=["Cake", "2"]
        ), contextlib.redirect_stdout(io.StringIO()):
            client.return_value.search_by_title.return_value = {
                "data": [{"Recipe_id": "123", "Recipe_title": "Cake"}]
            }
            app.main()
            client.return_value.get_recipe_by_id.assert_not_called()

    def test_search_collects_fifty_results_across_pages(self):
        pages = [
            {
                "data": [
                    {"Recipe_id": str(number), "Recipe_title": f"Cake {number}"}
                    for number in range(start, start + 10)
                ],
                "pagination": {"totalPages": 6},
            }
            for start in range(1, 61, 10)
        ]
        with patch.dict(os.environ, {"RECIPEDB_API_KEY": "offline-test-key"}), patch.object(
            RecipeDBClient, "_get", side_effect=pages
        ) as get:
            results = RecipeDBClient().search_by_title("Cake")

        self.assertEqual(len(results["data"]), 50)
        self.assertEqual(results["data"][-1]["Recipe_id"], "50")
        self.assertEqual(get.call_count, 5)
        self.assertEqual(get.call_args_list[-1].kwargs["params"]["page"], 5)

    def test_search_stops_if_api_repeats_a_page(self):
        page = {
            "data": [{"Recipe_id": "123", "Recipe_title": "Cake"}],
            "pagination": {"totalPages": 100},
        }
        with patch.dict(os.environ, {"RECIPEDB_API_KEY": "offline-test-key"}), patch.object(
            RecipeDBClient, "_get", return_value=page
        ) as get:
            results = RecipeDBClient().search_by_title("Cake")

        self.assertEqual(len(results["data"]), 1)
        self.assertEqual(get.call_count, 2)

    def test_fiftieth_result_can_be_selected(self):
        recipes = [
            {"Recipe_id": str(number), "Recipe_title": f"Cake {number}"}
            for number in range(1, 51)
        ]
        with patch("app.RecipeDBClient") as client, patch(
            "builtins.input", side_effect=["Cake", "50"]
        ), contextlib.redirect_stdout(io.StringIO()):
            client.return_value.search_by_title.return_value = {"data": recipes}
            client.return_value.get_recipe_by_id.return_value = {"Recipe_id": "50"}
            app.main()
            client.return_value.get_recipe_by_id.assert_called_once_with("50")


if __name__ == "__main__":
    unittest.main()
