import type { FC } from "react";
import { Home, MessageCircle, ClipboardCheck, LayoutGrid, Moon, Sun } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { STRINGS, t } from "@/lib/i18n";
import type { Lang } from "@/types";

export type TabKey = "home" | "chat" | "eligibility" | "browse";

export const NAV_ITEMS: { key: TabKey; icon: FC<{ className?: string }> }[] = [
  { key: "home", icon: Home },
  { key: "chat", icon: MessageCircle },
  { key: "eligibility", icon: ClipboardCheck },
  { key: "browse", icon: LayoutGrid },
];

export const navLabel = (key: TabKey, lang: Lang) => STRINGS.nav[key][lang];

interface Props {
  active: TabKey;
  onSelect: (tab: TabKey) => void;
  lang: Lang;
  dark: boolean;
  onToggleDark: () => void;
}

/** Desktop sidebar with logo, icon nav and dark-mode toggle. */
export function Sidebar({ active, onSelect, lang, dark, onToggleDark }: Props) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-2 border-r border-white/30 bg-white/30 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40 lg:flex">
      {/* Logo */}
      <div className="mb-6 flex items-center gap-3 px-1">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green to-brand-orange text-xl shadow-lg">
          🪷
        </div>
        <div>
          <p className="font-tamil text-sm font-bold leading-tight text-slate-800 dark:text-white">
            {t("appName", lang)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Tamil Nadu</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1.5">
        {NAV_ITEMS.map(({ key, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-4 py-3 text-left font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-brand-green to-brand-greenDark text-white shadow-lg shadow-emerald-500/25"
                  : "text-slate-600 hover:bg-white/50 dark:text-slate-300 dark:hover:bg-white/10",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{navLabel(key, lang)}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <button onClick={onToggleDark} className="btn-ghost justify-start">
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span>{dark ? "Light mode" : "Dark mode"}</span>
        </button>
        <div className="rounded-2xl border border-white/30 bg-white/30 p-3 text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
          Powered by local Ollama · Zero API cost
        </div>
      </div>
    </aside>
  );
}
