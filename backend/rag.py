"""Retrieval-Augmented Generation pipeline for the chat assistant.

Pipeline (mirrors the documents -> split -> embed -> FAISS -> retrieve -> LLM
-> answer flow):
1. On startup, embed every scheme with a sentence-transformer and index the
   vectors in FAISS (one index per domain).
2. For a user question, embed the query, retrieve the most relevant schemes for
   the active domain and inject them into a grounded prompt.
3. Stream the answer from the configured LLM.

LLM provider is pluggable:
  * ``ollama`` (default) — local llama3, free + offline.
  * ``openai`` — used automatically when ``OPENAI_API_KEY`` is set (or force with
    ``LLM_PROVIDER=openai``).

Everything degrades gracefully: missing FAISS / sentence-transformers falls back
to keyword retrieval, and an unreachable LLM returns a scheme-grounded fallback
answer instead of crashing.
"""
from __future__ import annotations

import json
import os
from typing import Any, Iterator

import httpx

from schemes_data import load_schemes

# --- LLM configuration ---------------------------------------------------- #
OLLAMA_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

EMBED_MODEL = os.getenv("EMBED_MODEL", "all-MiniLM-L6-v2")
DEFAULT_TOP_K = int(os.getenv("RAG_TOP_K", "4"))


def provider() -> str:
    """Resolve which LLM provider to use.

    Defaults to Ollama (free, offline). OpenAI is only used when explicitly
    requested with ``LLM_PROVIDER=openai`` *and* a key is present — so a stray
    ``OPENAI_API_KEY`` in the environment never silently hijacks the default.
    """
    forced = os.getenv("LLM_PROVIDER", "").lower()
    if forced == "openai" and OPENAI_API_KEY:
        return "openai"
    return "ollama"


SYSTEM_PROMPT = (
    "You are the Tamil Nadu Schemes Assistant, a helpful guide for citizens of "
    "Tamil Nadu (covering both differently-abled welfare schemes and farmer / "
    "agriculture schemes). Answer ONLY using the scheme information provided "
    "below. If the answer is not in the provided schemes, say you don't have "
    "that information and suggest contacting the relevant government office. Be "
    "warm, clear and concise. When you mention a scheme, use its full name. If "
    "the user writes in Tamil, reply in Tamil."
)


# --------------------------------------------------------------------------- #
# Retrieval
# --------------------------------------------------------------------------- #
class _Retriever:
    """Vector retriever backed by FAISS (per domain), with a keyword fallback."""

    def __init__(self) -> None:
        self.model = None
        self.indexes: dict[str, Any] = {}
        self.schemes_by_domain: dict[str, list[dict[str, Any]]] = {
            "welfare": load_schemes("welfare"),
            "agriculture": load_schemes("agriculture"),
        }
        self._build_indexes()

    @staticmethod
    def _scheme_text(s: dict[str, Any]) -> str:
        return (
            f"{s['name_en']} {s['name_ta']} {s['category']} {s['summary_en']} "
            f"{s['benefit_en']} {' '.join(s['eligibility_en'])}"
        )

    def _build_indexes(self) -> None:
        try:
            import faiss  # type: ignore
            from sentence_transformers import SentenceTransformer  # type: ignore

            self.model = SentenceTransformer(EMBED_MODEL)
            for domain, schemes in self.schemes_by_domain.items():
                texts = [self._scheme_text(s) for s in schemes]
                emb = self.model.encode(
                    texts, convert_to_numpy=True, normalize_embeddings=True
                )
                index = faiss.IndexFlatIP(emb.shape[1])
                index.add(emb)
                self.indexes[domain] = index
            print("[rag] FAISS indexes built for welfare + agriculture domains.")
        except Exception as exc:  # pragma: no cover - depends on optional deps
            print(f"[rag] Vector index unavailable ({exc}); using keyword fallback.")
            self.model = None
            self.indexes = {}

    def retrieve(self, query: str, domain: str = "welfare", k: int = DEFAULT_TOP_K) -> list[dict[str, Any]]:
        schemes = self.schemes_by_domain.get(domain, self.schemes_by_domain["welfare"])
        k = max(1, min(k, len(schemes)))

        if self.model is not None and domain in self.indexes:
            vec = self.model.encode(
                [query], convert_to_numpy=True, normalize_embeddings=True
            )
            _, idx = self.indexes[domain].search(vec, k)
            return [schemes[i] for i in idx[0]]
        return self._keyword_retrieve(query, schemes, k)

    def _keyword_retrieve(self, query: str, schemes: list[dict[str, Any]], k: int) -> list[dict[str, Any]]:
        words = {w for w in query.lower().split() if len(w) > 2}
        ranked = sorted(
            schemes,
            key=lambda s: sum(w in self._scheme_text(s).lower() for w in words),
            reverse=True,
        )
        scored = [s for s in ranked if any(w in self._scheme_text(s).lower() for w in words)]
        return (scored or ranked)[:k]


_retriever: _Retriever | None = None


def get_retriever() -> _Retriever:
    global _retriever
    if _retriever is None:
        _retriever = _Retriever()
    return _retriever


# --------------------------------------------------------------------------- #
# Prompt + LLM calls
# --------------------------------------------------------------------------- #
def _build_context(schemes: list[dict[str, Any]]) -> str:
    return "\n\n".join(
        "\n".join(
            [
                f"SCHEME: {s['name_en']} ({s['name_ta']})",
                f"Category: {s['category']}",
                f"Summary: {s['summary_en']}",
                f"Benefit: {s['benefit_en']}",
                f"Eligibility: {'; '.join(s['eligibility_en'])}",
                f"How to apply: {s['how_to_apply_en']}",
                f"Apply to: {s['apply_to']}",
            ]
        )
        for s in schemes
    )


def _build_prompt(query: str, schemes: list[dict[str, Any]], history: list[dict[str, str]] | None) -> str:
    context = _build_context(schemes)
    convo = ""
    if history:
        turns = "\n".join(f"{h['role'].capitalize()}: {h['content']}" for h in history[-6:])
        convo = f"=== CONVERSATION SO FAR ===\n{turns}\n\n"
    return (
        f"{SYSTEM_PROMPT}\n\n=== RELEVANT SCHEMES ===\n{context}\n\n"
        f"{convo}=== USER QUESTION ===\n{query}\n\n=== ANSWER ==="
    )


def llm_available() -> bool:
    if provider() == "openai":
        return bool(OPENAI_API_KEY)
    try:
        httpx.get(f"{OLLAMA_URL}/api/tags", timeout=2.0).raise_for_status()
        return True
    except Exception:
        return False


# Backwards-compatible alias used by the health endpoint.
def ollama_available() -> bool:
    return llm_available()


def _fallback_answer(schemes: list[dict[str, Any]]) -> str:
    if not schemes:
        return "⚠️ The AI model is not reachable right now and no matching schemes were found. Please contact the District Differently Abled Welfare Office directly."
    top = schemes[0]
    others = ", ".join(s["name_en"] for s in schemes[1:3])
    msg = (
        "⚠️ The AI model is not reachable right now, so here is the most relevant "
        "scheme from our records.\n\n"
        f"**{top['name_en']}**\n{top['summary_en']}\n\n"
        f"**Benefit:** {top['benefit_en']}\n\n"
        f"**How to apply:** {top['how_to_apply_en']}"
    )
    if others:
        msg += f"\n\nYou may also want to look at: {others}."
    return msg


def _stream_ollama(prompt: str) -> Iterator[str]:
    payload = {"model": OLLAMA_MODEL, "prompt": prompt, "stream": True}
    with httpx.stream("POST", f"{OLLAMA_URL}/api/generate", json=payload, timeout=120.0) as resp:
        resp.raise_for_status()
        for line in resp.iter_lines():
            if not line:
                continue
            data = json.loads(line)
            if data.get("response"):
                yield data["response"]
            if data.get("done"):
                break


def _stream_openai(prompt: str) -> Iterator[str]:
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
    payload = {
        "model": OPENAI_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "stream": True,
    }
    with httpx.stream(
        "POST", f"{OPENAI_BASE}/chat/completions", json=payload, headers=headers, timeout=120.0
    ) as resp:
        resp.raise_for_status()
        for line in resp.iter_lines():
            if not line or not line.startswith("data:"):
                continue
            data = line[5:].strip()
            if data == "[DONE]":
                break
            try:
                delta = json.loads(data)["choices"][0]["delta"].get("content")
            except (json.JSONDecodeError, KeyError, IndexError):
                continue
            if delta:
                yield delta


def stream_chat(
    query: str,
    history: list[dict[str, str]] | None = None,
    domain: str = "welfare",
    top_k: int = DEFAULT_TOP_K,
) -> Iterator[str]:
    """Yield the assistant's answer chunk-by-chunk (for SSE / streaming)."""
    schemes = get_retriever().retrieve(query, domain=domain, k=top_k)

    if not llm_available():
        yield _fallback_answer(schemes)
        return

    prompt = _build_prompt(query, schemes, history)
    try:
        streamer = _stream_openai if provider() == "openai" else _stream_ollama
        yield from streamer(prompt)
    except Exception as exc:  # pragma: no cover - network dependent
        yield f"\n\n⚠️ Lost connection to the AI model ({exc}).\n\n" + _fallback_answer(schemes)


def sources_for(query: str, domain: str = "welfare", top_k: int = DEFAULT_TOP_K) -> list[dict[str, str]]:
    """Return the schemes used to ground an answer, for the 'source' UI chips."""
    return [
        {"id": s["id"], "name_en": s["name_en"], "name_ta": s["name_ta"], "domain": s["domain"]}
        for s in get_retriever().retrieve(query, domain=domain, k=top_k)
    ]
