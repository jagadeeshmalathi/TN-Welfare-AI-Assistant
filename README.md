# 🪷 Tamil Nadu Welfare Schemes AI Assistant

A production-ready, **bilingual (English + தமிழ்)** AI assistant that helps
differently-abled citizens of Tamil Nadu discover the government welfare schemes
they're entitled to — through conversational chat, an eligibility checker, and a
searchable scheme directory.

Built with a **React + TypeScript** frontend and a **FastAPI + FAISS + Ollama**
RAG backend. Runs **fully offline** with a local LLM — **zero API costs**.

![Stack](https://img.shields.io/badge/frontend-React%2018%20%2B%20TS-10B981)
![Stack](https://img.shields.io/badge/backend-FastAPI-059669)
![LLM](https://img.shields.io/badge/LLM-Ollama%20llama3-F97316)
![Cost](https://img.shields.io/badge/API%20cost-%E2%82%B90-FBBF24)

---

## ✨ Features

| Feature | Description |
| --- | --- |
| 💬 **AI Chat (RAG)** | Streaming, word-by-word answers grounded **only** in official scheme data, with "Based on" source chips so every answer is traceable. |
| 🎯 **Eligibility Checker** | Rule-based, explainable scoring (0–100) across disability type, severity, age and purpose — every point comes with a human-readable reason. |
| 📚 **Browse Schemes** | Search + category filter over 10 officially-sourced schemes, with full detail (benefit, eligibility, documents, how to apply, official source link). |
| 🌐 **Bilingual** | Every scheme and the whole UI render in English or Tamil; preference is remembered. |
| 🪟 **Glass-morphism UI** | Tamil Nadu green–orange–gold theme, frosted-glass cards, dark mode, fully responsive (desktop sidebar → mobile bottom nav). |
| 🔌 **Graceful fallback** | If Ollama is offline, chat returns the most relevant scheme data directly instead of erroring. If FAISS isn't installed, retrieval falls back to keyword search. |

---

## 🗂️ Project structure

```
TN-welfare/
├── backend/                 # FastAPI + RAG
│   ├── main.py              # API endpoints (chat, eligibility, schemes…)
│   ├── rag.py               # FAISS retrieval + Ollama streaming (with fallbacks)
│   ├── eligibility.py       # transparent rule-based scoring
│   ├── schemes_data.py      # data loader / search
│   ├── data/schemes.json    # 10 bilingual, officially-sourced schemes
│   ├── requirements.txt
│   ├── Procfile / railway.json   # deployment
│   └── .env.example
└── frontend/                # React 18 + TS + Tailwind + Vite
    ├── src/
    │   ├── components/      # Sidebar, ChatTab, EligibilityTab, BrowseTab, …
    │   ├── hooks/           # useChat, useEligibility, useSchemes
    │   ├── lib/             # api client, i18n, utils
    │   └── App.tsx
    ├── tailwind.config.ts
    ├── vercel.json          # deployment
    └── .env.example
```

---

## 🚀 Quick start (local)

### Prerequisites
- **Python 3.11+** and **Node 18+**
- **[Ollama](https://ollama.com)** with the `llama3` model:
  ```bash
  ollama pull llama3
  ```

### 1. Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # optional — defaults work out of the box
uvicorn main:app --reload --port 8000
```
> `faiss-cpu` / `sentence-transformers` are optional. If they fail to install on
> your platform, the backend automatically uses keyword retrieval — everything
> still works.

API docs are then live at **http://localhost:8000/docs**.

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173**. In dev, Vite proxies `/api` → `http://localhost:8000`,
so no extra config is needed.

---

## 🔌 API reference

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/schemes?category=&search=` | List / search schemes |
| `GET` | `/schemes/{id}` | Full detail for one scheme |
| `GET` | `/categories` | Distinct categories (EN + TA) |
| `POST` | `/eligibility` | Rule-based eligibility scoring |
| `POST` | `/chat` | Streaming (SSE) RAG answer |
| `GET` | `/health` | Liveness + Ollama status |

---

## ☁️ Deployment

- **Frontend → Vercel**: framework auto-detected (Vite). Set
  `VITE_BACKEND_URL` to your deployed backend URL. `vercel.json` is included.
- **Backend → Railway**: `railway.json` / `Procfile` included. Point
  `OLLAMA_API_URL` at a reachable Ollama instance and set `CORS_ORIGINS` to your
  frontend origin.

---

## 📚 Data & sources

All 10 schemes are **hand-curated from official Tamil Nadu government sources**
(`scd.tn.gov.in`, district welfare portals). Each scheme record carries its
`source_url` and `source_name`, surfaced in the UI for transparency. This is an
informational tool — always verify with the **District Differently Abled Welfare
Officer** before applying.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full technical design.
