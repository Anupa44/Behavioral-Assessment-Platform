"""Tests for the AI question-generation service."""
from types import SimpleNamespace

from django.test import SimpleTestCase, override_settings

from apps.assessments.ai_service import (
    AIConfigurationError,
    _coerce_questions,
    _mock_questions,
    _strip_fences,
    generate_questions,
)

DISC = [
    {"name": "Dominance", "code": "D"},
    {"name": "Influence", "code": "I"},
    {"name": "Steadiness", "code": "S"},
    {"name": "Compliance", "code": "C"},
]
BIG_FIVE = DISC + [{"name": "Neuroticism", "code": "N"}]


def _framework(name="Big Five"):
    return SimpleNamespace(name=name)


def _traits(dicts):
    return [SimpleNamespace(name=d["name"], code=d["code"]) for d in dicts]


class MockProviderTests(SimpleTestCase):
    def test_shape_and_coverage(self):
        for traits in (DISC, BIG_FIVE):
            for count in (1, 3, 5, 10, 20):
                qs = _mock_questions("F", traits, "focus", count)
                self.assertEqual(len(qs), count)
                for q in qs:
                    self.assertTrue(q["prompt"])
                    self.assertEqual(len(q["options"]), 4)
                    codes = [o["trait_code"] for o in q["options"]]
                    self.assertEqual(len(set(codes)), 4, codes)
                    self.assertEqual(len({o["text"] for o in q["options"]}), 4)
                if count >= len(traits):
                    used = {o["trait_code"] for q in qs for o in q["options"]}
                    self.assertEqual(used, {t["code"] for t in traits})

    def test_no_duplicate_prompts(self):
        qs = _mock_questions("F", BIG_FIVE, "focus", 15)
        self.assertEqual(len({q["prompt"] for q in qs}), 15)

    def test_regenerate_varies(self):
        stems = {_mock_questions("F", BIG_FIVE, "x", 1)[0]["prompt"] for _ in range(25)}
        self.assertGreater(len(stems), 1)

    @override_settings(AI_PROVIDER="mock")
    def test_generate_questions_uses_mock_without_a_key(self):
        qs = generate_questions(_framework(), _traits(BIG_FIVE), "leadership", 5)
        self.assertEqual(len(qs), 5)


class ConfigurationErrorTests(SimpleTestCase):
    @override_settings(AI_PROVIDER="openrouter", OPENROUTER_API_KEY="your-openrouter-key")
    def test_placeholder_key_raises_actionable_error_not_a_401(self):
        with self.assertRaises(AIConfigurationError) as ctx:
            generate_questions(_framework(), _traits(BIG_FIVE), "x", 2)
        msg = str(ctx.exception)
        self.assertIn("OPENROUTER_API_KEY", msg)
        self.assertIn("placeholder", msg)
        self.assertIn("AI_PROVIDER=mock", msg)

    @override_settings(AI_PROVIDER="openai", OPENAI_API_KEY="")
    def test_empty_key_raises_actionable_error(self):
        with self.assertRaises(AIConfigurationError) as ctx:
            generate_questions(_framework(), _traits(BIG_FIVE), "x", 2)
        self.assertIn("is empty", str(ctx.exception))

    @override_settings(AI_PROVIDER="bogus")
    def test_unknown_provider(self):
        with self.assertRaises(AIConfigurationError) as ctx:
            generate_questions(_framework(), _traits(BIG_FIVE), "x", 2)
        self.assertIn("Unknown AI_PROVIDER", str(ctx.exception))

    @override_settings(AI_PROVIDER="mock")
    def test_framework_without_traits(self):
        with self.assertRaises(ValueError) as ctx:
            generate_questions(_framework(), [], "x", 2)
        self.assertIn("no traits", str(ctx.exception))


class ResponseParsingTests(SimpleTestCase):
    def test_strip_fences(self):
        self.assertEqual(_strip_fences('```json\n{"a": 1}\n```'), '{"a": 1}')
        self.assertEqual(_strip_fences('```\n[1]\n```'), "[1]")
        self.assertEqual(_strip_fences('{"a": 1}'), '{"a": 1}')

    def test_coerce_accepts_bare_array(self):
        data = [{"prompt": "P", "options": [
            {"text": "a", "trait_code": "D"}, {"text": "b", "trait_code": "I"}]}]
        self.assertEqual(len(_coerce_questions(data)), 1)

    def test_coerce_accepts_wrapped_object(self):
        data = {"questions": [{"prompt": "P", "options": [
            {"text": "a", "trait_code": "D"}, {"text": "b", "trait_code": "I"}]}]}
        self.assertEqual(len(_coerce_questions(data)), 1)

    def test_coerce_accepts_alternate_field_names(self):
        data = {"items": [{"question": "P", "answers": [
            {"option": "a", "trait": "D"}, {"label": "b", "code": "I"}]}]}
        out = _coerce_questions(data)
        self.assertEqual(out[0]["prompt"], "P")
        self.assertEqual(out[0]["options"][0], {"text": "a", "trait_code": "D"})

    def test_coerce_drops_malformed_and_raises_when_nothing_usable(self):
        with self.assertRaises(ValueError):
            _coerce_questions([{"prompt": "P"}, {"options": []}, "junk"])
