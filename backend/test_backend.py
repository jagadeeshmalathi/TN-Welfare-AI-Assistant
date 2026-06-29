"""Automated tests for the TN Welfare backend.

Run with:  pytest test_backend.py -v
The backend does NOT need to be running separately — TestClient is used.
"""
from __future__ import annotations

import json
import pytest
from fastapi.testclient import TestClient

from main import app
from eligibility import check_eligibility, score_scheme
from schemes_data import get_scheme, list_categories, load_schemes, search_schemes
from rag import _fallback_answer, get_retriever

client = TestClient(app)


# ──────────────────────────────────────────────────────────────────────────────
# Data integrity
# ──────────────────────────────────────────────────────────────────────────────

class TestDataIntegrity:
    REQUIRED_WELFARE = [
        "id", "name_en", "name_ta", "category", "category_ta",
        "summary_en", "summary_ta", "benefit_en", "benefit_ta",
        "benefit_amount", "eligibility_en", "eligibility_ta",
        "documents_required_en", "how_to_apply_en", "how_to_apply_ta",
        "apply_to", "disability_types", "min_disability_percent",
        "purposes", "age_min", "age_max", "source_url", "source_name", "domain",
    ]

    def test_welfare_scheme_count(self):
        assert len(load_schemes("welfare")) == 10

    def test_agriculture_scheme_count(self):
        assert len(load_schemes("agriculture")) == 9

    def test_total_scheme_count(self):
        assert len(load_schemes()) == 19

    def test_welfare_schema_completeness(self):
        for s in load_schemes("welfare"):
            missing = [f for f in self.REQUIRED_WELFARE if f not in s]
            assert missing == [], f"Scheme {s['id']} missing fields: {missing}"

    def test_welfare_domain_field(self):
        for s in load_schemes("welfare"):
            assert s["domain"] == "welfare", f"{s['id']} has wrong domain"

    def test_agriculture_domain_field(self):
        for s in load_schemes("agriculture"):
            assert s["domain"] == "agriculture", f"{s['id']} has wrong domain"

    def test_all_ids_unique(self):
        all_schemes = load_schemes()
        ids = [s["id"] for s in all_schemes]
        assert len(ids) == len(set(ids)), "Duplicate scheme IDs found"

    def test_benefit_amount_non_negative(self):
        for s in load_schemes("welfare"):
            assert s["benefit_amount"] >= 0, f"{s['id']} has negative benefit_amount"

    def test_age_range_valid(self):
        for s in load_schemes("welfare"):
            assert s["age_min"] <= s["age_max"], f"{s['id']} has age_min > age_max"

    def test_min_disability_percent_range(self):
        for s in load_schemes("welfare"):
            assert 0 <= s["min_disability_percent"] <= 100

    def test_get_scheme_valid(self):
        s = get_scheme("maintenance_allowance_severe")
        assert s is not None
        assert s["id"] == "maintenance_allowance_severe"

    def test_get_scheme_invalid(self):
        assert get_scheme("does_not_exist") is None

    def test_categories_all(self):
        cats = list_categories()
        assert len(cats) >= 16
        for c in cats:
            assert "en" in c and "ta" in c

    def test_categories_welfare_only(self):
        cats = list_categories("welfare")
        assert 1 <= len(cats) <= 10

    def test_categories_agriculture_only(self):
        cats = list_categories("agriculture")
        assert 1 <= len(cats) <= 9


# ──────────────────────────────────────────────────────────────────────────────
# Search / filter
# ──────────────────────────────────────────────────────────────────────────────

class TestSearch:
    def test_search_returns_all_with_no_filter(self):
        results = search_schemes()
        assert len(results) == 19

    def test_search_by_domain(self):
        assert len(search_schemes(domain="welfare")) == 10
        assert len(search_schemes(domain="agriculture")) == 9

    def test_search_by_category(self):
        results = search_schemes(category="Financial Assistance")
        assert len(results) >= 1
        for r in results:
            assert r["category"] == "Financial Assistance"

    def test_search_case_insensitive(self):
        r1 = search_schemes(category="financial assistance")
        r2 = search_schemes(category="Financial Assistance")
        assert len(r1) == len(r2)

    def test_search_by_query_english(self):
        results = search_schemes(query="maintenance")
        assert len(results) >= 1
        assert all("maintenance" in (r["name_en"] + r["summary_en"]).lower() for r in results)

    def test_search_empty_query_returns_all(self):
        assert len(search_schemes(query="")) == 19

    def test_search_no_match_returns_empty(self):
        results = search_schemes(query="xyzzy_no_match_99999")
        assert results == []

    def test_search_xss_input_safe(self):
        results = search_schemes(query="<script>alert(1)</script>")
        assert isinstance(results, list)

    def test_search_sql_injection_safe(self):
        results = search_schemes(query="'; DROP TABLE schemes; --")
        assert isinstance(results, list)

    def test_category_all_returns_full_domain(self):
        # "all" should be treated as no filter
        results = search_schemes(domain="welfare", category="all")
        assert len(results) == 10


# ──────────────────────────────────────────────────────────────────────────────
# Eligibility engine
# ──────────────────────────────────────────────────────────────────────────────

class TestEligibility:
    def setup_method(self):
        import json
        with open("data/schemes.json", encoding="utf-8") as f:
            self._schemes = json.load(f)
        self._severe = next(s for s in self._schemes if s["id"] == "maintenance_allowance_severe")

    def test_perfect_match_scores_100(self):
        score, reasons = score_scheme(self._severe, "physical", 100, 30, "financial")
        assert score == 100

    def test_at_disability_boundary_passes(self):
        # min_disability_percent = 75 for severe scheme
        score, reasons = score_scheme(self._severe, "physical", 75, 30, "financial")
        assert score == 100
        assert any("meets" in r for r in reasons)

    def test_below_disability_boundary_penalised(self):
        score_below, _ = score_scheme(self._severe, "physical", 74, 30, "financial")
        score_above, _ = score_scheme(self._severe, "physical", 75, 30, "financial")
        assert score_below < score_above

    def test_wrong_disability_type_penalised(self):
        score_wrong, _ = score_scheme(self._severe, "visual", 100, 30, "financial")
        score_right, _ = score_scheme(self._severe, "physical", 100, 30, "financial")
        assert score_wrong < score_right

    def test_unknown_disability_type_penalised(self):
        score, reasons = score_scheme(self._severe, "zombie", 100, 30, "financial")
        assert score < 100

    def test_score_never_exceeds_100(self):
        # Artificially inflate by calling with everything correct
        score, _ = score_scheme(self._severe, "locomotor", 100, 30, "financial")
        assert score <= 100

    def test_all_nulls_returns_partial_score(self):
        score, _ = score_scheme(self._severe, None, None, None, None)
        assert 0 < score < 100

    def test_check_eligibility_returns_top_5(self):
        results = check_eligibility("physical", 80, 30, "financial")
        assert len(results) == 5

    def test_check_eligibility_sorted_desc(self):
        results = check_eligibility("physical", 80, 30, "financial")
        scores = [r["score"] for r in results]
        assert scores == sorted(scores, reverse=True)

    def test_check_eligibility_all_nulls(self):
        results = check_eligibility()
        assert len(results) == 5
        assert all(0 <= r["score"] <= 100 for r in results)

    def test_check_eligibility_unknown_purpose(self):
        results = check_eligibility(purpose="nonexistent_purpose_xyz")
        assert len(results) == 5

    def test_check_eligibility_only_welfare_schemes(self):
        results = check_eligibility("physical", 80, 30, "financial")
        all_ids = {s["id"] for s in load_schemes("welfare")}
        for r in results:
            assert r["scheme_id"] in all_ids, f"Agriculture scheme {r['scheme_id']} in eligibility results"

    def test_reasons_are_non_empty(self):
        results = check_eligibility("physical", 80, 30, "financial")
        for r in results:
            assert len(r["reasons"]) > 0


# ──────────────────────────────────────────────────────────────────────────────
# RAG retriever
# ──────────────────────────────────────────────────────────────────────────────

class TestRetriever:
    def test_retriever_keyword_fallback_works(self):
        r = get_retriever()
        # FAISS not installed; keyword fallback must succeed
        results = r.retrieve("maintenance allowance physical", domain="welfare", k=3)
        assert len(results) == 3

    def test_retriever_unknown_domain_falls_back(self):
        r = get_retriever()
        results = r.retrieve("test", domain="unknown_domain", k=2)
        # Falls back to welfare
        assert len(results) >= 1

    def test_retriever_respects_k_with_no_query_words(self):
        # Empty query → words set is empty → scored=[] → ranked[:k] is returned
        r = get_retriever()
        for k in (1, 3, 5):
            results = r.retrieve("", domain="welfare", k=k)
            assert len(results) == k, f"Expected {k} results for k={k}"

    def test_retriever_k_capped_at_scheme_count(self):
        # Empty query → all schemes ranked equally → capped at len(schemes)
        r = get_retriever()
        results = r.retrieve("", domain="welfare", k=999)
        assert len(results) == 10  # 10 welfare schemes

    def test_retriever_keyword_returns_only_matching(self):
        # Query "allowance" matches 3 welfare schemes — returns 3 even if k=5
        r = get_retriever()
        results = r.retrieve("allowance", domain="welfare", k=5)
        assert 1 <= len(results) <= 5

    def test_retriever_empty_query_returns_k(self):
        r = get_retriever()
        results = r.retrieve("", domain="welfare", k=4)
        assert len(results) == 4

    def test_fallback_answer_non_empty_schemes(self):
        schemes = load_schemes("welfare")[:2]
        answer = _fallback_answer(schemes)
        assert schemes[0]["name_en"] in answer

    def test_fallback_answer_empty_list_no_crash(self):
        # Bug fix: used to raise IndexError
        answer = _fallback_answer([])
        assert isinstance(answer, str)
        assert len(answer) > 0


# ──────────────────────────────────────────────────────────────────────────────
# API endpoints (TestClient — no live server needed)
# ──────────────────────────────────────────────────────────────────────────────

class TestAPI:
    def test_root(self):
        r = client.get("/")
        assert r.status_code == 200
        d = r.json()
        assert d["schemes"] == 19
        assert "llm_available" in d

    def test_health(self):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_categories_all(self):
        r = client.get("/categories")
        assert r.status_code == 200
        assert len(r.json()) >= 16

    def test_categories_welfare(self):
        r = client.get("/categories?domain=welfare")
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_categories_agriculture(self):
        r = client.get("/categories?domain=agriculture")
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_schemes_all(self):
        r = client.get("/schemes")
        assert r.status_code == 200
        assert len(r.json()) == 19

    def test_schemes_by_domain(self):
        r = client.get("/schemes?domain=welfare")
        assert r.status_code == 200
        assert len(r.json()) == 10

    def test_schemes_search(self):
        r = client.get("/schemes?search=maintenance")
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_schemes_empty_search(self):
        r = client.get("/schemes?search=")
        assert r.status_code == 200
        assert len(r.json()) == 19

    def test_scheme_detail_valid(self):
        r = client.get("/schemes/maintenance_allowance_severe")
        assert r.status_code == 200
        assert r.json()["id"] == "maintenance_allowance_severe"

    def test_scheme_detail_invalid(self):
        r = client.get("/schemes/nonexistent")
        assert r.status_code == 404

    def test_eligibility_normal(self):
        r = client.post("/eligibility", json={
            "disability_type": "physical",
            "disability_percent": 80,
            "age": 30,
            "purpose": "financial",
        })
        assert r.status_code == 200
        d = r.json()
        assert "matches" in d
        assert len(d["matches"]) == 5
        assert d["matches"][0]["score"] >= d["matches"][-1]["score"]

    def test_eligibility_all_nulls(self):
        r = client.post("/eligibility", json={})
        assert r.status_code == 200
        assert len(r.json()["matches"]) == 5

    def test_eligibility_invalid_percent(self):
        r = client.post("/eligibility", json={"disability_percent": 150})
        assert r.status_code == 422

    def test_eligibility_negative_age(self):
        r = client.post("/eligibility", json={"age": -1})
        assert r.status_code == 422

    def test_chat_empty_message_rejected(self):
        r = client.post("/chat", json={"message": ""})
        assert r.status_code == 422

    def test_chat_whitespace_message_rejected(self):
        # Bug fix: was returning 200 before
        r = client.post("/chat", json={"message": "   "})
        assert r.status_code == 422

    def test_chat_message_too_long_rejected(self):
        r = client.post("/chat", json={"message": "a" * 2001})
        assert r.status_code == 422

    def test_chat_invalid_domain_rejected(self):
        r = client.post("/chat", json={"message": "test", "domain": "INVALID"})
        assert r.status_code == 422

    def test_chat_top_k_too_high(self):
        r = client.post("/chat", json={"message": "test", "top_k": 50})
        assert r.status_code == 422

    def test_chat_top_k_zero(self):
        r = client.post("/chat", json={"message": "test", "top_k": 0})
        assert r.status_code == 422

    def test_chat_valid_returns_stream(self):
        # Streaming endpoint — TestClient collects full body
        with client.stream("POST", "/chat", json={"message": "What is maintenance allowance?"}) as r:
            assert r.status_code == 200
            body = r.read().decode()
        assert "data:" in body
        # Must have sources event
        assert '"type": "sources"' in body
        # Must have done event
        assert '"type": "done"' in body

    def test_chat_sources_have_required_fields(self):
        with client.stream("POST", "/chat", json={"message": "allowance"}) as r:
            body = r.read().decode()
        sources_line = next(l for l in body.split("\n") if '"type": "sources"' in l)
        sources = json.loads(sources_line.replace("data: ", ""))["sources"]
        for s in sources:
            assert "id" in s
            assert "name_en" in s
            assert "name_ta" in s

    def test_cors_not_wildcard(self):
        r = client.options("/health", headers={"Origin": "http://evil.com", "Access-Control-Request-Method": "GET"})
        # Should not have Access-Control-Allow-Origin: *
        acao = r.headers.get("access-control-allow-origin", "")
        assert acao != "*", "CORS wildcard must not be present"
