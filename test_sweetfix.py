"""Local tests for sugar detection, condition rules, and heat screening."""

import contextlib
import io
import unittest
from unittest.mock import patch

import app
from disease_filter import load_disease_rules, remaining_candidates, screen_conditions
from recipe_analysis import find_sugar_ingredients
from recipe_classifier import heating_temperatures, infer_sweetener_heat, recipe_category
from sweetener_filter import load_sweeteners, maximum_stability_temperature, screen_sweeteners, temperature_review_sweeteners


class SugarDetectionTests(unittest.TestCase):
    def test_plain_sugar_and_written_amount(self):
        ingredients = [
            {"name": "sugar", "text": "1 cup granulated sugar"},
            {"name": "sucrose", "text": "100 g sucrose"},
            {"name": "sugar", "text": "2 tbsp brown sugar"},
            {"name": "honey", "text": "3 tbsp honey"},
            {"name": "sugar substitute", "text": "1 tsp sugar substitute"},
        ]
        matches = find_sugar_ingredients(ingredients)
        self.assertEqual([item["amount"] for item in matches], ["1 cup", "100 g"])


class RecipeCategoryTests(unittest.TestCase):
    def test_four_simple_categories(self):
        examples = [
            ({"title": "Vanilla cake", "instructions": ["Bake at 180 C."]}, "Baked"),
            ({"title": "Tomato soup", "instructions": ["Simmer for 20 minutes."]}, "Cooked"),
            ({"title": "Lemonade", "instructions": ["Boil syrup, then chill."]}, "Beverage"),
            ({"title": "No-bake cheesecake", "instructions": ["Chill for 2 hours."]}, "Other"),
        ]
        for recipe, expected in examples:
            with self.subTest(recipe=recipe["title"]):
                self.assertEqual(recipe_category(recipe), expected)


class HeatScreenTests(unittest.TestCase):
    def test_heat_is_inferred_from_sugar_timing(self):
        examples = [
            (["Mix sugar into batter.", "Bake at 180 C."], True),
            (["Boil water.", "Cool completely.", "Stir in sugar and chill."], False),
            (["Mix sugar with yogurt and chill."], False),
            (["Boil sugar syrup, then chill."], True),
            (["Bake crust.", "Cool completely.", "Add sugar to cold frosting."], False),
            (["Boil water and let cool completely before adding sugar."], False),
        ]
        for instructions, expected in examples:
            with self.subTest(instructions=instructions):
                self.assertIs(infer_sweetener_heat({"instructions": instructions})["heated"], expected)

    def test_unclear_heat_is_not_reported_as_no_heat(self):
        examples = [
            [],
            ["Preheat oven to 180 C."],
            ["Boil water.", "Add sugar."],
            ["Simmer the sauce for ten minutes."],
        ]
        for instructions in examples:
            with self.subTest(instructions=instructions):
                self.assertIsNone(infer_sweetener_heat({"instructions": instructions})["heated"])
        self.assertIsNone(infer_sweetener_heat({
            "title": "Vanilla cake", "instructions": ["Mix sugar into batter."],
        })["heated"])

    def test_heat_filters_only_two_ids(self):
        filtered = screen_sweeteners(True, load_sweeteners())
        self.assertEqual({item["id"] for item in filtered}, {"SW020", "SW058"})

    def test_no_heat_filters_nothing(self):
        self.assertEqual(screen_sweeteners(False, load_sweeteners()), [])

    def test_recipe_temperature_is_read_and_fahrenheit_converted(self):
        settings = heating_temperatures({
            "instructions": ["Chill at 40 F.", "Preheat oven to 350 degrees Fahrenheit.", "Bake at 180 C."],
        })
        self.assertEqual([item["celsius"] for item in settings], [176.7, 180.0])

    def test_preheat_without_baking_is_not_a_sweetener_temperature(self):
        self.assertEqual(heating_temperatures({"instructions": ["Preheat oven to 180 C."]}), [])

    def test_only_real_maximums_are_used_as_cutoffs(self):
        entries = [
            {"id": "SW900", "name": "Example", "exclude_when_heated": False, "max_stable_c": 150},
            {"id": "SW901", "name": "Lower-bound example", "exclude_when_heated": False, "max_stable_c": None},
        ]
        self.assertEqual(screen_sweeteners(True, entries, 150), [])
        self.assertEqual([item["id"] for item in screen_sweeteners(True, entries, 180)], ["SW900"])

    def test_database_lower_bounds_are_not_maximums(self):
        self.assertEqual(maximum_stability_temperature("RETAINED — <150 °C"), 150)
        self.assertIsNone(maximum_stability_temperature("RETAINED — >160 °C"))
        self.assertIsNone(maximum_stability_temperature("Stable at 100–150 °C for 4 h"))

    def test_dry_powder_decomposition_is_review_only(self):
        sweeteners = load_sweeteners()
        self.assertEqual(temperature_review_sweeteners(100, sweeteners), [])
        self.assertEqual([item["id"] for item in temperature_review_sweeteners(180, sweeteners)], ["SW021"])
        self.assertNotIn("SW021", {item["id"] for item in screen_sweeteners(True, sweeteners, 180)})


class ConditionScreenTests(unittest.TestCase):
    def test_rule_sheet_covers_all_conditions_and_known_ids(self):
        data = load_disease_rules()
        sweetener_ids = {item["id"] for item in load_sweeteners()}
        self.assertEqual(len(data["conditions"]), 38)
        self.assertEqual(len(data["rules"]), 82)
        self.assertTrue(all(rule["sweetener_id"] in sweetener_ids for rule in data["rules"]))

    def test_hfi_blocks_and_review_are_kept_separate(self):
        result = screen_conditions(["Hereditary fructose intolerance (HFI)"], load_sweeteners())
        self.assertEqual(
            {item["id"] for item in result["blocked"]},
            {"SW001", "SW003", "SW006", "SW008", "SW009", "SW010", "SW013", "SW021"},
        )
        self.assertEqual(
            {item["id"] for item in result["notes"]["REVIEW"]},
            {"SW002", "SW005", "SW007", "SW012"},
        )

    def test_pku_blocks_aspartame_and_diabetes_is_conservatively_removed(self):
        sweeteners = load_sweeteners()
        pku = screen_conditions(["Phenylketonuria (PKU / PAH deficiency)"], sweeteners)
        self.assertEqual({item["id"] for item in pku["blocked"]}, {"SW020"})
        diabetes = screen_conditions(["Diabetes mellitus type 1 or type 2"], sweeteners)
        self.assertEqual(diabetes["blocked"], [])
        self.assertEqual({item["id"] for item in diabetes["notes"]["SOFT PENALTY"]}, {"SW001", "SW013", "SW014"})
        self.assertEqual({item["id"] for item in diabetes["removed"]}, {"SW001", "SW013", "SW014"})

    def test_limits_remove_but_no_auto_block_does_not(self):
        sweeteners = load_sweeteners()
        lactose = screen_conditions(["Lactose intolerance / lactase non-persistence"], sweeteners)
        self.assertEqual(lactose["blocked"], [])
        self.assertEqual([item["id"] for item in lactose["notes"]["LIMIT"]], ["SW016"])
        self.assertEqual([item["id"] for item in lactose["removed"]], ["SW016"])
        duarte = screen_conditions(["Duarte galactosemia"], sweeteners)
        self.assertEqual(duarte["blocked"], [])
        self.assertEqual(duarte["removed"], [])
        self.assertEqual({item["id"] for item in duarte["notes"]["NO AUTO BLOCK"]}, {"SW016", "SW017"})

    def test_erythritol_blends_and_combined_exclusions(self):
        sweeteners = load_sweeteners()
        gi = screen_conditions(["GI tolerance / diarrhea risk"], sweeteners)
        self.assertEqual({item["id"] for item in gi["notes"]["LIMIT"]}, {"SW004", "ING006", "ING007"})
        self.assertEqual({item["id"] for item in gi["removed"]}, {"SW004", "ING006", "ING007"})
        hfi = screen_conditions(["Hereditary fructose intolerance (HFI)"], sweeteners)
        heat = screen_sweeteners(True, sweeteners)
        remaining = {item["id"] for item in remaining_candidates(sweeteners, heat, hfi)}
        self.assertNotIn("SW001", remaining)
        self.assertNotIn("SW021", remaining)
        self.assertNotIn("SW020", remaining)
        self.assertNotIn("SW002", remaining)  # REVIEW is a conservative project exclusion.

    def test_a_block_wins_when_multiple_conditions_are_selected(self):
        result = screen_conditions([
            "Duarte galactosemia",
            "Generalized GALE deficiency",
            "Lactose intolerance / lactase non-persistence",
        ], load_sweeteners())
        self.assertEqual({item["id"] for item in result["blocked"]}, {"SW016", "SW017"})
        self.assertEqual({item["id"] for item in result["removed"]}, {"SW016", "SW017"})
        self.assertNotIn("SW016", {item["id"] for item in result["notes"]["LIMIT"]})
        self.assertNotIn("SW017", {item["id"] for item in result["notes"]["NO AUTO BLOCK"]})

    def test_hypertension_blocks_glycyrrhizin(self):
        result = screen_conditions(["Hypertension"], load_sweeteners())
        self.assertEqual({item["id"] for item in result["blocked"]}, {"SW047"})


class DemoFlowTests(unittest.TestCase):
    def _run_demo(self, ingredient, instructions=None, condition_numbers=None, title="Test cake"):
        if instructions is None:
            instructions = ["Bake at 180 C for 25 minutes."]
        recipe = {
            "data": {
                "recipe": {"Recipe_id": 10, "Recipe_title": title},
                "ingredients": [{"ingredient": ingredient, "ingredient_Phrase": f"1 cup {ingredient}"}],
                "instructions": [{"steps": step} for step in instructions],
            }
        }
        client = unittest.mock.Mock()
        client.search_by_title.return_value = [{"Recipe_id": 10, "Recipe_title": title}]
        client.get_recipe_by_id.return_value = recipe
        if ingredient == "sugar":
            condition_answers = ["n"] if condition_numbers is None else ["y", condition_numbers]
            answers = iter(["cake", "1", *condition_answers, "n"])
        else:
            answers = iter(["cake", "1", "n"])
        output = io.StringIO()
        with patch.object(app, "RecipeDBClient", return_value=client), patch("builtins.input", side_effect=lambda _: next(answers)), contextlib.redirect_stdout(output):
            app.main()
        return output.getvalue()

    def test_sugar_recipe_screens(self):
        output = self._run_demo("sugar")
        self.assertIn("Table sugar (sucrose) | listed amount: 1 cup", output)
        self.assertIn("Highest stated oven setting: 180 °C", output)
        self.assertIn("Heat: sweeteners filtered out:", output)
        self.assertIn("SW020 | Aspartame", output)
        self.assertIn("SW058 | Monellin", output)
        self.assertNotIn("SW001 | Sucrose", output)
        self.assertIn("Recipe category: Baked", output)
        self.assertIn("No conditions selected", output)
        self.assertIn("Sweetener heat: Yes", output)
        self.assertIn("Review SW021 | Sucralose", output)

    def test_no_heat_recipe_filters_nothing(self):
        output = self._run_demo("sugar", ["Mix sugar with yogurt and chill."], title="Fruit dessert")
        self.assertIn("Sweetener heat: No", output)
        self.assertIn("No heat: no sweeteners filtered because of heat.", output)
        self.assertNotIn("SW020 | Aspartame", output)

    def test_unclear_recipe_applies_conservative_heat_screen(self):
        output = self._run_demo("sugar", ["Boil water.", "Add sugar."], title="Sweet tea")
        self.assertIn("Sweetener heat: Unclear", output)
        self.assertIn("Applying the heat screen conservatively", output)
        self.assertIn("SW020 | Aspartame", output)

    def test_honey_recipe_skips_sugar_screen(self):
        output = self._run_demo("honey")
        self.assertIn("Replacement screen skipped", output)
        self.assertNotIn("Heat: sweeteners filtered out", output)

    def test_hfi_selection_shows_blocked_ids(self):
        output = self._run_demo("sugar", ["Mix sugar with yogurt and chill."], "1", title="Fruit dessert")
        self.assertIn("Original sugar in this recipe is flagged", output)
        self.assertIn("SW021 | Sucralose (BLOCK)", output)
        self.assertIn("Removed from possible replacement sweeteners:", output)
        self.assertIn("SW002 | D-Allulose (D-Psicose) (REVIEW)", output)


if __name__ == "__main__":
    unittest.main()
