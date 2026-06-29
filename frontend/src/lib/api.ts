import type { Category, ChatSource, EligibilityForm, EligibilityMatch, Scheme } from "@/types";

const BASE = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") ?? "/api";

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  // ponytail: removed dead domain param that was silently shadowing category in callers
  listSchemes(category?: string, search?: string): Promise<Scheme[]> {
    const params = new URLSearchParams();
    if (category && category !== "all") params.set("category", category);
    if (search) params.set("search", search);
    const qs = params.toString();
    return getJSON<Scheme[]>(`/schemes${qs ? `?${qs}` : ""}`);
  },

  getScheme(id: string): Promise<Scheme> {
    return getJSON<Scheme>(`/schemes/${id}`);
  },

  categories(): Promise<Category[]> {
    return getJSON<Category[]>("/categories");
  },

  checkEligibility(form: EligibilityForm): Promise<{ matches: EligibilityMatch[] }> {
    return fetch(`${BASE}/eligibility`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).then((r) => {
      if (!r.ok) throw new Error(`Eligibility failed: ${r.status}`);
      return r.json();
    });
  },

  async streamChat(
    message: string,
    history: { role: string; content: string }[],
    handlers: {
      onSources?: (s: ChatSource[]) => void;
      onChunk: (text: string) => void;
      onDone?: () => void;
      signal?: AbortSignal;
    },
  ): Promise<void> {
    const res = await fetch(`${BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, conversation_history: history }),
      signal: handlers.signal,
    });
    if (!res.ok || !res.body) throw new Error(`Chat failed: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";
      for (const frame of frames) {
        const line = frame.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "sources") handlers.onSources?.(evt.sources);
          else if (evt.type === "chunk") handlers.onChunk(evt.content);
          else if (evt.type === "done") handlers.onDone?.();
        } catch { /* ignore malformed frame */ }
      }
    }
    handlers.onDone?.();
  },
};
