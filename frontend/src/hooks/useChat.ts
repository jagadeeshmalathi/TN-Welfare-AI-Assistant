import { useRef, useState } from "react";
import { api } from "@/lib/api";
import type { ChatMessage, ChatSource } from "@/types";

/** Streaming chat state machine: appends user msg, then streams the answer. */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed },
      { role: "assistant", content: "" },
    ]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let sources: ChatSource[] = [];

    try {
      await api.streamChat(trimmed, history, {
        signal: controller.signal,
        onSources: (s) => {
          sources = s;
          setMessages((prev) => patchLast(prev, { sources }));
        },
        onChunk: (chunk) => {
          setMessages((prev) =>
            patchLast(prev, { content: prev[prev.length - 1].content + chunk }),
          );
        },
      });
    } catch {
      setMessages((prev) =>
        patchLast(prev, {
          content:
            "⚠️ Could not reach the assistant. Please make sure the backend is running.",
        }),
      );
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  function clear() {
    stop();
    setMessages([]);
  }

  return { messages, streaming, send, stop, clear };
}

/** Immutably patch the last (assistant) message in the list. */
function patchLast(list: ChatMessage[], patch: Partial<ChatMessage>): ChatMessage[] {
  const next = [...list];
  next[next.length - 1] = { ...next[next.length - 1], ...patch };
  return next;
}
