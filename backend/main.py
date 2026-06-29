"""FastAPI application for the Tamil Nadu Welfare Schemes AI Assistant.

Endpoints:
    GET  /                  -> health / metadata
    GET  /health            -> liveness probe (also reports Ollama status)
    GET  /schemes           -> list/search schemes (?category= &search=)
    GET  /schemes/{id}      -> full detail for one scheme
    GET  /categories        -> distinct categories (EN + TA)
    POST /eligibility       -> rule-based eligibility scoring
    POST /chat              -> streaming RAG answer from Ollama
"""
from __future__ import annotations

import json
import os
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator

import rag
from eligibility import check_eligibility
from schemes_data import get_scheme, list_categories, load_schemes, search_schemes

app = FastAPI(
    title="Tamil Nadu Welfare Schemes AI Assistant",
    description="RAG-powered assistant for differently-abled welfare schemes in Tamil Nadu.",
    version="1.0.0",
)

# CORS — allow the Vite dev server and the deployed frontend.
_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


# --------------------------------------------------------------------------- #
# Request models
# --------------------------------------------------------------------------- #
class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_history: list[ChatMessage] = Field(default_factory=list)
    domain: Literal["welfare", "agriculture"] = "welfare"
    top_k: int = Field(default=4, ge=1, le=10)

    @field_validator("message")
    @classmethod
    def message_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("message must not be blank")
        return v


class EligibilityRequest(BaseModel):
    disability_type: str | None = None
    disability_percent: int | None = Field(default=None, ge=0, le=100)
    age: int | None = Field(default=None, ge=0, le=120)
    purpose: str | None = None


# --------------------------------------------------------------------------- #
# Routes
# --------------------------------------------------------------------------- #
@app.get("/")
def root() -> dict:
    return {
        "name": "Tamil Nadu Schemes AI Assistant",
        "version": "2.0.0",
        "schemes": len(load_schemes()),
        "domains": {
            "welfare": len(load_schemes("welfare")),
            "agriculture": len(load_schemes("agriculture")),
        },
        "llm_available": rag.llm_available(),
        "llm_provider": rag.provider(),
        "docs": "/docs",
    }


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "llm_available": rag.llm_available(),
        "llm_provider": rag.provider(),
    }


@app.get("/categories")
def categories(domain: str | None = None) -> list[dict[str, str]]:
    return list_categories(domain=domain)


@app.get("/schemes")
def schemes(domain: str | None = None, category: str | None = None, search: str | None = None) -> list[dict]:
    return search_schemes(domain=domain, category=category, query=search)


@app.get("/schemes/{scheme_id}")
def scheme_detail(scheme_id: str) -> dict:
    scheme = get_scheme(scheme_id)
    if scheme is None:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme


@app.post("/eligibility")
def eligibility(req: EligibilityRequest) -> dict:
    matches = check_eligibility(
        disability_type=req.disability_type,
        disability_percent=req.disability_percent,
        age=req.age,
        purpose=req.purpose,
    )
    return {"matches": matches}


@app.post("/chat")
def chat(req: ChatRequest) -> StreamingResponse:
    history = [m.model_dump() for m in req.conversation_history]
    sources = rag.sources_for(req.message, domain=req.domain, top_k=req.top_k)

    def event_stream():
        # First event carries the grounding sources so the UI can show them.
        yield _sse({"type": "sources", "sources": sources})
        for chunk in rag.stream_chat(req.message, history, domain=req.domain, top_k=req.top_k):
            yield _sse({"type": "chunk", "content": chunk})
        yield _sse({"type": "done"})

    return StreamingResponse(event_stream(), media_type="text/event-stream")


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=bool(os.getenv("RELOAD", "")),
    )
