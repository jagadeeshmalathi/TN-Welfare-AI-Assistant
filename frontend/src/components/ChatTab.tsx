import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Bot, User, Square, BookOpen } from "@/lib/icons";
import { useChat } from "@/hooks/useChat";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Lang } from "@/types";

const QUICK_PROMPTS: { en: string; ta: string }[] = [
  { en: "What maintenance allowance can I get?", ta: "எனக்கு என்ன பராமரிப்பு உதவித்தொகை கிடைக்கும்?" },
  { en: "Help for a deaf college student", ta: "காது கேளாத கல்லூரி மாணவருக்கு உதவி" },
  { en: "How do I get a UDID card?", ta: "UDID அட்டை எப்படி பெறுவது?" },
  { en: "Loans to start a small business", ta: "சிறு தொழில் தொடங்க கடன்" },
];

interface Props {
  lang: Lang;
}

export function ChatTab({ lang }: Props) {
  const { messages, streaming, send, stop } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const submit = (text?: string) => {
    const value = text ?? input;
    if (!value.trim()) return;
    send(value);
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-13rem)] flex-col lg:h-[calc(100vh-9rem)]">
      {/* Messages */}
      <div ref={scrollRef} className="scroll-slim flex-1 space-y-4 overflow-y-auto px-1 pb-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-green to-brand-orange text-3xl shadow-xl">
              💬
            </div>
            <p className="max-w-sm text-slate-500 dark:text-slate-300">{t("chatEmpty", lang)}</p>
            <div className="mt-6 grid w-full max-w-lg gap-2 sm:grid-cols-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p.en}
                  onClick={() => submit(p[lang])}
                  className="flex items-center gap-2 rounded-2xl border border-white/40 bg-white/40 px-4 py-3 text-left text-sm font-medium text-slate-700 backdrop-blur-md transition hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-brand-orange" />
                  {p[lang]}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <Bubble key={i} message={m} lang={lang} streaming={streaming && i === messages.length - 1} />
        ))}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="glass flex items-center gap-2 p-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("chatPlaceholder", lang)}
          className="flex-1 bg-transparent px-3 py-2 text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
          aria-label={t("chatPlaceholder", lang)}
        />
        {streaming ? (
          <button type="button" onClick={stop} className="btn-ghost" aria-label="Stop">
            <Square className="h-4 w-4 fill-current" />
          </button>
        ) : (
          <button type="submit" className="btn-primary" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">{t("send", lang)}</span>
          </button>
        )}
      </form>
    </div>
  );
}

function Bubble({
  message,
  lang,
  streaming,
}: {
  message: import("@/types").ChatMessage;
  lang: Lang;
  streaming: boolean;
}) {
  const isUser = message.role === "user";
  const empty = !message.content && streaming;

  return (
    <div className={cn("flex animate-fade-in-up gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-white shadow",
          isUser ? "bg-brand-orange" : "bg-gradient-to-br from-brand-green to-brand-greenDark",
        )}
      >
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </div>
      <div className={cn("max-w-[78%]", isUser && "text-right")}>
        <div
          className={cn(
            "inline-block whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm",
            isUser
              ? "rounded-tr-md bg-gradient-to-r from-brand-orange to-brand-orangeDark text-white"
              : "rounded-tl-md border border-white/40 bg-white/55 text-slate-800 backdrop-blur-md dark:border-white/10 dark:bg-white/10 dark:text-slate-100",
          )}
        >
          {empty ? (
            <span className="flex gap-1 py-1">
              <span className="typing-dot animate-pulse-dot" />
              <span className="typing-dot animate-pulse-dot [animation-delay:0.2s]" />
              <span className="typing-dot animate-pulse-dot [animation-delay:0.4s]" />
            </span>
          ) : (
            message.content
          )}
        </div>

        {/* Source schemes */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
              <BookOpen className="h-3 w-3" />
              {t("source", lang)}:
            </span>
            {message.sources.slice(0, 3).map((s) => (
              <span key={s.id} className="chip">
                {lang === "ta" ? s.name_ta : s.name_en}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
