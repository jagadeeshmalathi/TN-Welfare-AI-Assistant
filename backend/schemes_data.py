"""Loads and serves the curated Tamil Nadu scheme datasets.

Two hand-curated, officially sourced datasets live under ``data/``:
  * ``schemes.json``             -> differently-abled welfare schemes (domain="welfare")
  * ``agriculture_schemes.json`` -> farmer / agriculture schemes  (domain="agriculture")

Each record carries a ``domain`` field so the API, retriever and UI can scope
results to the category the user is currently exploring. This module is the
single source of truth the rest of the backend reads from.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).parent / "data"
WELFARE_FILE = DATA_DIR / "schemes.json"
AGRI_FILE = DATA_DIR / "agriculture_schemes.json"

VALID_DOMAINS = ("welfare", "agriculture")


def _read(path: Path, default_domain: str) -> list[dict[str, Any]]:
    with path.open(encoding="utf-8") as fh:
        records = json.load(fh)
    for r in records:
        r.setdefault("domain", default_domain)
    return records


@lru_cache(maxsize=1)
def load_all() -> list[dict[str, Any]]:
    """Read every scheme from both datasets once and cache them."""
    return _read(WELFARE_FILE, "welfare") + _read(AGRI_FILE, "agriculture")


def load_schemes(domain: str | None = None) -> list[dict[str, Any]]:
    """Return schemes, optionally scoped to a single domain."""
    schemes = load_all()
    if domain and domain.lower() in VALID_DOMAINS:
        return [s for s in schemes if s["domain"] == domain.lower()]
    return schemes


def get_scheme(scheme_id: str) -> dict[str, Any] | None:
    """Return a single scheme by id, or ``None`` if it does not exist."""
    return next((s for s in load_all() if s["id"] == scheme_id), None)


def list_categories(domain: str | None = None) -> list[dict[str, str]]:
    """Return the distinct categories (with Tamil labels) for a domain."""
    seen: dict[str, str] = {}
    for scheme in load_schemes(domain):
        seen.setdefault(scheme["category"], scheme.get("category_ta", scheme["category"]))
    return [{"en": en, "ta": ta} for en, ta in sorted(seen.items())]


def search_schemes(
    domain: str | None = None,
    category: str | None = None,
    query: str | None = None,
) -> list[dict[str, Any]]:
    """Filter schemes by domain, optional category and free-text query.

    The query matches case-insensitively across English and Tamil name, summary
    and category so the browse search box works in both languages.
    """
    results = load_schemes(domain)

    if category and category.lower() != "all":
        results = [s for s in results if s["category"].lower() == category.lower()]

    if query:
        q = query.strip().lower()
        fields = ("name_en", "name_ta", "summary_en", "summary_ta", "category", "category_ta")
        results = [
            s for s in results
            if any(q in str(s.get(field, "")).lower() for field in fields)
        ]

    return results
