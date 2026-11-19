"""
Multi-provider AI service for question generation.

Supports: openai, openrouter, gemini, mock

`mock` requires no API key and builds a valid question set locally. It is the
default so the feature works out of the box; set AI_PROVIDER + the matching
API key in .env to use a real model.
"""
import json
import random
import re

from django.conf import settings

# Values that mean "nobody configured a real key yet" - the .env.example
# placeholders. Treated as missing so the user gets an actionable message
# instead of a raw 401 from the provider.
_PLACEHOLDER_PREFIXES = ("your-", "sk-xxx", "changeme", "replace-me", "<")

DEFAULT_MODELS = {
    "openai": "gpt-4o-mini",
    "openrouter": "google/gemini-2.0-flash-001",
}

PROVIDER_KEY_SETTING = {
    "openai": "OPENAI_API_KEY",
    "openrouter": "OPENROUTER_API_KEY",
    "gemini": "GEMINI_API_KEY",
}


class AIConfigurationError(ValueError):
    """Raised when the configured provider has no usable credentials."""


def _is_placeholder(value):
    if not value or not value.strip():
        return True
    v = value.strip().lower()
    return any(v.startswith(p) for p in _PLACEHOLDER_PREFIXES)


def _resolve_key(provider):
    setting_name = PROVIDER_KEY_SETTING[provider]
    key = getattr(settings, setting_name, "") or ""
    if _is_placeholder(key):
        detail = (
            "is still set to a placeholder value" if key.strip() else "is empty"
        )
        raise AIConfigurationError(
            f"AI_PROVIDER is '{provider}' but {setting_name} {detail} in your .env. "
            f"Add a real API key and restart the server, or set AI_PROVIDER=mock to "
            f"generate sample questions without an API key."
        )
    return key.strip()


def _model_for(provider):
    return (getattr(settings, "AI_MODEL", "") or "").strip() or DEFAULT_MODELS[provider]


def _build_prompt(framework_name, traits, user_prompt, question_count):
    trait_list = ", ".join([f"{t['name']} ({t['code']})" for t in traits])
    trait_codes = ", ".join([t["code"] for t in traits])
    return f"""You are an expert psychometric assessment designer specializing in {framework_name} behavioral assessments.

Generate exactly {question_count} multiple-choice questions for a behavioral assessment.

Framework: {framework_name}
Traits to cover: {trait_list}
Assessment focus: {user_prompt}

Requirements:
1. Each question must have exactly 4 answer options.
2. Each answer option must map to exactly one trait.
3. All traits must appear across the full set of questions.
4. Questions should be situational or behavioral (e.g., "In a team meeting, you tend to...").
5. Answer options should be plausible and non-obvious. Do not make one option clearly "better".
6. No duplicate questions.

Return ONLY a valid JSON object of the form {{"questions": [...]}} where each item is:
  {{
    "prompt": "Question text here",
    "options": [
      {{"text": "Option text", "trait_code": "TRAIT_CODE"}},
      {{"text": "Option text", "trait_code": "TRAIT_CODE"}},
      {{"text": "Option text", "trait_code": "TRAIT_CODE"}},
      {{"text": "Option text", "trait_code": "TRAIT_CODE"}}
    ]
  }}

Trait codes to use: {trait_codes}"""


def _strip_fences(content):
    """Pull the JSON payload out of a response that may wrap it in code fences."""
    content = (content or "").strip()
    if content.startswith("```"):
        content = re.sub(r"^```[a-zA-Z]*\s*", "", content)
        content = re.sub(r"\s*```$", "", content).strip()
    return content


def _call_openai_compatible(api_key, base_url, model, prompt, extra_headers=None):
    from openai import OpenAI

    client = OpenAI(api_key=api_key, base_url=base_url, default_headers=extra_headers or {})
    kwargs = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.8,
    }
    try:
        response = client.chat.completions.create(
            response_format={"type": "json_object"}, **kwargs
        )
    except Exception:
        # Not every model/route supports response_format - retry without it
        # rather than failing the whole generation.
        response = client.chat.completions.create(**kwargs)

    if not response.choices:
        raise ValueError("AI provider returned no choices")
    return _strip_fences(response.choices[0].message.content)


def _call_gemini(api_key, prompt, model_name="gemini-1.5-flash"):
    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name)
    response = model.generate_content(prompt)
    return _strip_fences(response.text)


# --------------------------------------------------------------------------
# Mock provider - no API key required
# --------------------------------------------------------------------------

_MOCK_STEMS = [
    "In a team meeting where opinions clash, you most often...",
    "When a project deadline suddenly moves up by a week, your first instinct is to...",
    "A colleague asks for help while you are deep in focused work. You...",
    "After receiving critical feedback on your work, you typically...",
    "When joining a group of people you have never met, you tend to...",
    "Faced with an ambiguous task and no clear instructions, you...",
    "When a plan you championed starts to fail, you usually...",
    "Asked to present to senior leadership at short notice, you...",
    "When your team disagrees about priorities, you are the one who...",
    "At the end of a demanding week, you recharge by...",
    "Handed a process that clearly could work better, you...",
    "When someone on the team is visibly struggling, you...",
    "Given a choice between a proven approach and an untested one, you...",
    "When details in a shared document do not add up, you...",
    "Starting a long project, the first thing you do is...",
]

_MOCK_OPTIONS = [
    "Take the lead and set a clear direction for everyone else.",
    "Step back and weigh the options before committing to anything.",
    "Bring the right people in and build agreement first.",
    "Stick with the approach that has reliably worked before.",
    "Look for an angle nobody has tried yet.",
    "Slow down and make sure every detail is right.",
    "Check in on how the people involved are feeling about it.",
    "Write down the trade-offs and decide from the list.",
    "Push for a quick decision and adjust as you learn.",
    "Ask for guidance from someone more experienced.",
    "Keep your own counsel and work it through alone.",
    "Name the risk out loud so nobody is surprised later.",
]


def _mock_questions(framework_name, traits, user_prompt, question_count):
    """Local generator producing schema-valid questions without an API key."""
    rng = random.Random()
    questions = []
    # Random starting point so "regenerate this question" actually yields a
    # different scenario instead of repeating the same one.
    start = rng.randrange(len(_MOCK_STEMS))
    pool, deferred = [], []

    for n in range(question_count):
        i = start + n
        stem = _MOCK_STEMS[i % len(_MOCK_STEMS)]
        if n >= len(_MOCK_STEMS):
            stem = f"{stem} (scenario {n // len(_MOCK_STEMS) + 1})"

        # Draw from a reshuffled pool so every trait gets covered across the
        # set and no single question repeats a trait (when there are >= 4).
        picked = []
        while len(picked) < 4:
            if not pool:
                pool = traits[:]
                rng.shuffle(pool)
            candidate = pool.pop()
            if candidate in picked and len(traits) >= 4:
                # Would duplicate within this question - defer it.
                deferred.append(candidate)
                continue
            picked.append(candidate)
        while deferred:
            pool.append(deferred.pop())

        texts = rng.sample(_MOCK_OPTIONS, 4)
        options = [
            {"text": texts[k], "trait_code": picked[k]["code"]} for k in range(4)
        ]
        questions.append({"prompt": stem, "options": options})

    return questions


# --------------------------------------------------------------------------


def _coerce_questions(data):
    """Normalize whatever shape the model returned into a list of questions."""
    if isinstance(data, dict):
        for key in ("questions", "items", "data", "results"):
            if isinstance(data.get(key), list):
                data = data[key]
                break
        else:
            lists = [v for v in data.values() if isinstance(v, list)]
            if not lists:
                raise ValueError("AI response contained no question list")
            data = lists[0]

    if not isinstance(data, list):
        raise ValueError("AI response was not a list of questions")

    cleaned = []
    for item in data:
        if not isinstance(item, dict):
            continue
        prompt = item.get("prompt") or item.get("question") or item.get("text")
        options = item.get("options") or item.get("answers") or []
        if not prompt or not isinstance(options, list) or len(options) < 2:
            continue
        norm_opts = []
        for opt in options:
            if not isinstance(opt, dict):
                continue
            text = opt.get("text") or opt.get("option") or opt.get("label")
            code = opt.get("trait_code") or opt.get("trait") or opt.get("code")
            if text and code:
                norm_opts.append({"text": str(text), "trait_code": str(code)})
        if len(norm_opts) >= 2:
            cleaned.append({"prompt": str(prompt), "options": norm_opts})

    if not cleaned:
        raise ValueError("AI returned no usable questions")
    return cleaned


def generate_questions(framework, traits_qs, user_prompt, question_count=10):
    """
    Returns a list of dicts: [{prompt, options: [{text, trait_code}]}]
    Raises ValueError on failure.
    """
    traits = [{"name": t.name, "code": t.code} for t in traits_qs]
    if not traits:
        raise ValueError(
            "This framework has no traits - add traits before generating questions."
        )

    provider = (settings.AI_PROVIDER or "mock").strip().lower()

    if provider == "mock":
        return _mock_questions(framework.name, traits, user_prompt, question_count)

    if provider not in PROVIDER_KEY_SETTING:
        valid = ", ".join(sorted(list(PROVIDER_KEY_SETTING) + ["mock"]))
        raise AIConfigurationError(f"Unknown AI_PROVIDER '{provider}'. Use one of: {valid}.")

    api_key = _resolve_key(provider)  # raises AIConfigurationError, not a raw 401
    prompt = _build_prompt(framework.name, traits, user_prompt, question_count)

    try:
        if provider == "openai":
            raw = _call_openai_compatible(
                api_key=api_key,
                base_url="https://api.openai.com/v1",
                model=_model_for("openai"),
                prompt=prompt,
            )
        elif provider == "openrouter":
            raw = _call_openai_compatible(
                api_key=api_key,
                base_url="https://openrouter.ai/api/v1",
                model=_model_for("openrouter"),
                prompt=prompt,
                extra_headers={
                    "HTTP-Referer": getattr(settings, "FRONTEND_URL", "") or "",
                    "X-Title": "Behavioral Assessment Platform",
                },
            )
        else:  # gemini
            raw = _call_gemini(api_key, prompt)
    except AIConfigurationError:
        raise
    except Exception as e:
        raise ValueError(f"AI generation failed ({provider}): {e}")

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # Some models prepend prose - grab the first JSON object/array.
        match = re.search(r"(\{.*\}|\[.*\])", raw or "", re.DOTALL)
        if not match:
            raise ValueError("AI returned invalid JSON")
        try:
            data = json.loads(match.group(1))
        except json.JSONDecodeError as e:
            raise ValueError(f"AI returned invalid JSON: {e}")

    return _coerce_questions(data)
