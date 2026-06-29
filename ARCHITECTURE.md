# Architecture — Tamil Nadu Welfare Schemes AI Assistant

## 1. System overview

```
┌──────────────────────────────┐         ┌───────────────────────────────────────┐
│   Frontend (React + Vite)    │         │        Backend (FastAPI)              │
│                              │  HTTP   │                                       │
│  ChatTab ────────────────────┼────────▶│  POST /chat   ──► rag.py              │
│  EligibilityTab ─────────────┼────────▶│  POST /eligibility ─► eligibility.py  │
│  BrowseTab ──────────────────┼────────▶│  GET  /schemes  ─► schemes_data.py    │
│                              │  (SSE   │                    │                  │
│  hooks/ + lib/api.ts         │  stream)│                    ▼                  │
└──────────────────────────────┘         │   FAISS index  ◄── data/schemes.json  │
                                         │        │                              │
                                         │        ▼                              │
                                         │   Ollama (llama3)  — local LLM        │
                                         └───────────────────────────────────────┘
```

The frontend is a static SPA; all intelligence lives in the backend. The only
external runtime dependency is a **local Ollama** server — there are no paid APIs.

---

## 2. Backend

### 2.1 Data layer (`schemes_data.py`)
- Single source of truth: `data/schemes.json` — 10 bilingual scheme records.
- Each record is **fully bilingual** (`*_en` / `*_ta` fields) plus structured
  matching metadata (`disability_types`, `min_disability_percent`, `age_min/max`,
  `purposes`, `benefit_amount`).
- Loaded once and cached (`functools.lru_cache`); provides search and category
  helpers and a `schemes_as_context()` renderer for the RAG prompt.

### 2.2 RAG pipeline (`rag.py`)
1. **Indexing** — on first use, every scheme is embedded with
   `sentence-transformers` (`all-MiniLM-L6-v2`) and stored in a FAISS
   `IndexFlatIP` (cosine similarity on normalized vectors).
2. **Retrieval** — the user query is embedded and the top-`k` (default 4) schemes
   are selected.
3. **Generation** — retrieved schemes are injected into a grounded system prompt
   ("answer ONLY using the provided schemes") and streamed token-by-token from
   Ollama via its `/api/generate` streaming endpoint.

**Resilience by design:**
- No FAISS / sentence-transformers installed → automatic **keyword retrieval**.
- Ollama unreachable → a **scheme-grounded fallback answer** is returned instead
  of an error, so the product never hard-fails in a demo.

### 2.3 Eligibility engine (`eligibility.py`)
A deliberately **transparent, rule-based** scorer (not an opaque model) so users
understand *why* a scheme matches:

| Factor | Max points | Logic |
| --- | --- | --- |
| Disability type | 35 | Exact match against the scheme's covered types |
| Disability % | 25 | Meets the scheme's minimum threshold |
| Age | 20 | Falls within the scheme's age window |
| Purpose | 20 | Purpose tags overlap (with a synonym map) |

Every awarded/withheld point produces a human-readable reason string returned to
the UI. Schemes are ranked and the top 5 returned.

### 2.4 API (`main.py`)
FastAPI with CORS for the Vite dev server and deployed frontend. `/chat` returns
a **Server-Sent Events** stream: a first `sources` frame (for the UI's source
chips), then `chunk` frames, then `done`.

---

## 3. Frontend

### 3.1 Stack
React 18 + TypeScript + Vite + Tailwind CSS. Icons via `lucide-react`. No heavy
state library — local component state + three focused hooks is sufficient.

### 3.2 Structure
- **`lib/api.ts`** — typed client; manually parses the SSE stream for `/chat`.
- **`lib/i18n.ts`** — UI string table + bilingual field accessors; the single
  place language switching is handled.
- **`hooks/`** — `useChat` (streaming state machine), `useEligibility`,
  `useSchemes` (debounced search + category filter).
- **`components/`** — `Sidebar` / `MobileNav` (shared nav config), `ChatTab`,
  `EligibilityTab`, `BrowseTab`, `SchemeDetailModal`, `GlassCard`, `Hero`,
  `LanguageToggle`.

### 3.3 Design system
- **Theme**: Tamil Nadu green (`#10B981`) → orange (`#F97316`) → temple gold
  (`#FBBF24`), defined as `brand.*` Tailwind tokens.
- **Glass morphism**: `.glass` / `.glass-strong` component classes
  (`backdrop-blur`, translucent bg, soft borders, large radii) drive every card.
- **Responsive**: desktop sidebar (`lg:flex`) collapses to a mobile bottom nav
  bar; grids reflow 1 → 2 → 3 columns.
- **Dark mode**: `class` strategy, persisted to `localStorage`.
- **Accessibility**: semantic landmarks, `aria-current`/`aria-pressed`,
  keyboard-dismissable modal, focus-visible inputs.

---

## 4. Request lifecycles

**Chat**
```
user types → useChat.send() → api.streamChat() POST /chat
  → backend: rag.sources_for() emits sources frame
  → rag.stream_chat(): FAISS retrieve → prompt → Ollama stream → chunk frames
  → frontend appends chunks to the last assistant bubble in real time
```

**Eligibility**
```
form submit → useEligibility.check() POST /eligibility
  → eligibility.check_eligibility() scores all schemes
  → ranked top-5 with reasons → animated result cards
```

---

## 5. Design decisions & trade-offs

- **Local Ollama over cloud APIs** — zero cost, full privacy, works offline; the
  trade-off is the user must run Ollama locally, mitigated by graceful fallback.
- **Rule-based eligibility over ML** — for a government welfare tool,
  explainability and correctness matter more than learned nuance.
- **10 verified schemes over 15 padded ones** — accuracy of official data was
  prioritized; Tamil translations were added to the verified set rather than
  inventing additional schemes.
- **SSE over WebSockets** — chat is one-directional streaming; SSE is simpler and
  proxy-friendly.

---

## 6. Possible extensions
- Persist conversations / user profiles.
- PDF export and shareable scheme links.
- Admin panel to update `schemes.json`.
- Expand the dataset and add human-verified Tamil review.
