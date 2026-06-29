"""Rule-based eligibility scoring for welfare schemes.

Given an applicant's profile (disability type, severity, age and the purpose
they are seeking help for) this ranks the schemes by a transparent, explainable
score rather than a black-box model — every point awarded comes with a reason
string the frontend can show the user.
"""
from __future__ import annotations

from typing import Any

from schemes_data import load_schemes

# Synonyms so free-text purposes from the UI map onto the tags in the data.
PURPOSE_ALIASES: dict[str, set[str]] = {
    "employment": {"employment", "business", "self_employment", "economic"},
    "education": {"education", "scholarship"},
    "marriage": {"marriage"},
    "travel": {"travel", "transport"},
    "financial": {"financial", "maintenance"},
    "rehabilitation": {"rehabilitation", "therapy", "shelter", "care"},
    "assistive_device": {"assistive_device", "mobility"},
    "identification": {"identification", "certificate"},
    "health": {"health"},
}


def _purpose_tags(purpose: str | None) -> set[str]:
    if not purpose:
        return set()
    key = purpose.strip().lower().replace(" ", "_")
    return PURPOSE_ALIASES.get(key, {key})


def score_scheme(
    scheme: dict[str, Any],
    disability_type: str | None,
    disability_percent: int | None,
    age: int | None,
    purpose: str | None,
) -> tuple[int, list[str]]:
    """Return a 0-100 match score and a list of human-readable reasons."""
    score = 0
    reasons: list[str] = []

    # --- Disability type (up to 35 points) ---
    if disability_type:
        dtype = disability_type.strip().lower()
        if dtype in [t.lower() for t in scheme["disability_types"]]:
            score += 35
            reasons.append(f"Covers {disability_type} disability")
        else:
            reasons.append(f"Primarily for other disability types, not {disability_type}")
    else:
        score += 15  # unknown type — give partial benefit of the doubt

    # --- Disability percentage (up to 25 points) ---
    required = scheme.get("min_disability_percent", 0)
    if disability_percent is not None:
        if disability_percent >= required:
            score += 25
            if required > 0:
                reasons.append(
                    f"Your {disability_percent}% meets the {required}% minimum"
                )
        else:
            reasons.append(
                f"Requires at least {required}% disability (you entered {disability_percent}%)"
            )
    else:
        score += 12

    # --- Age window (up to 20 points) ---
    age_min = scheme.get("age_min", 0)
    age_max = scheme.get("age_max", 120)
    if age is not None:
        if age_min <= age <= age_max:
            score += 20
            if age_min > 0 or age_max < 120:
                reasons.append(f"Your age {age} is within the {age_min}-{age_max} range")
        else:
            reasons.append(f"Age must be between {age_min} and {age_max} (you entered {age})")
    else:
        score += 10

    # --- Purpose (up to 20 points) ---
    wanted = _purpose_tags(purpose)
    if wanted:
        scheme_purposes = {p.lower() for p in scheme.get("purposes", [])}
        if wanted & scheme_purposes:
            score += 20
            reasons.append(f"Matches your goal of {purpose}")
        else:
            reasons.append(f"Not focused on {purpose}")
    else:
        score += 10

    return min(score, 100), reasons


def check_eligibility(
    disability_type: str | None = None,
    disability_percent: int | None = None,
    age: int | None = None,
    purpose: str | None = None,
    top_n: int = 5,
) -> list[dict[str, Any]]:
    """Score every welfare scheme and return the top matches, best first.

    Eligibility scoring is disability-based, so it is intentionally scoped to the
    ``welfare`` domain; agriculture schemes are explored via chat and browse.
    """
    scored: list[dict[str, Any]] = []
    for scheme in load_schemes("welfare"):
        score, reasons = score_scheme(
            scheme, disability_type, disability_percent, age, purpose
        )
        scored.append(
            {
                "scheme_id": scheme["id"],
                "name_en": scheme["name_en"],
                "name_ta": scheme["name_ta"],
                "category": scheme["category"],
                "benefit_en": scheme["benefit_en"],
                "score": score,
                "reasons": reasons,
            }
        )

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_n]
