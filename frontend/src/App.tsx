import { useEffect, useMemo, useState } from "react";
import { Moon, Sun, MessageCircle, ClipboardCheck, LayoutGrid } from "@/lib/icons";
import { Sidebar, navLabel, type TabKey } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Hero } from "@/components/Hero";
import { ChatTab } from "@/components/ChatTab";
import { EligibilityTab } from "@/components/EligibilityTab";
import { BrowseTab } from "@/components/BrowseTab";
import { SchemeDetailModal } from "@/components/SchemeDetailModal";
import { STRINGS, t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useSchemes } from "@/hooks/useSchemes";
import type { Lang, Scheme } from "@/types";

export default function App() {
  const [tab, setTab] = useState<TabKey>("home");
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("lang") as Lang) || "en");
  const [dark, setDark] = useState<boolean>(() => localStorage.getItem("theme") === "dark");
  const [activeScheme, setActiveScheme] = useState<Scheme | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => localStorage.setItem("lang", lang), [lang]);

  return (
    <div className="app-bg min-h-screen text-slate-900 dark:text-slate-100">
      <div className="mx-auto flex max-w-[1400px]">
        <Sidebar active={tab} onSelect={setTab} lang={lang} dark={dark} onToggleDark={() => setDark((d) => !d)} />

        <main className="min-w-0 flex-1 px-4 pb-24 pt-4 sm:px-6 lg:pb-8">
          <header className="mb-5 flex items-center justify-between gap-3">
            <div className="lg:hidden">
              <p className="font-tamil text-lg font-extrabold text-slate-800 dark:text-white">
                {STRINGS.nav[tab][lang]}
              </p>
            </div>
            <div className="hidden lg:block">
              <h1 className="font-tamil text-2xl font-extrabold text-slate-800 dark:text-white">
                {navLabel(tab, lang)}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {/* ponytail: LanguageToggle deleted — inlined, it was a file for 2 buttons */}
              <div className="inline-flex items-center rounded-full border border-white/40 bg-white/40 p-1 backdrop-blur-md dark:border-white/10 dark:bg-white/5" role="group" aria-label="Language">
                {(["en", "ta"] as const).map((v) => (
                  <button key={v} onClick={() => setLang(v)} aria-pressed={lang === v}
                    className={cn("rounded-full px-3 py-1 text-sm font-semibold transition-all",
                      lang === v ? "bg-gradient-to-r from-brand-green to-brand-greenDark text-white shadow" : "text-slate-600 hover:text-brand-greenDark dark:text-slate-300")}>
                    {v === "en" ? "EN" : "தமிழ்"}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setDark((d) => !d)}
                className="rounded-full border border-white/40 bg-white/40 p-2 text-slate-600 backdrop-blur-md transition hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 lg:hidden"
                aria-label="Toggle dark mode"
              >
                {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </header>

          {tab === "home" && <HomeView lang={lang} onNavigate={setTab} onViewScheme={setActiveScheme} />}
          {tab === "chat" && <ChatTab lang={lang} />}
          {tab === "eligibility" && <EligibilityTab lang={lang} onViewScheme={setActiveScheme} />}
          {tab === "browse" && <BrowseTab lang={lang} onViewScheme={setActiveScheme} />}
        </main>
      </div>

      <MobileNav active={tab} onSelect={setTab} lang={lang} />
      <SchemeDetailModal scheme={activeScheme} lang={lang} onClose={() => setActiveScheme(null)} />
    </div>
  );
}

function HomeView({ lang, onNavigate, onViewScheme }: {
  lang: Lang;
  onNavigate: (tab: TabKey) => void;
  onViewScheme: (s: Scheme) => void;
}) {
  const { schemes, categories } = useSchemes();
  const featured = useMemo(() => schemes.slice(0, 3), [schemes]);

  const actions = [
    { tab: "chat" as const, icon: MessageCircle, title: STRINGS.nav.chat[lang], desc: t("chatEmpty", lang) },
    { tab: "eligibility" as const, icon: ClipboardCheck, title: t("checkEligibility", lang), desc: t("eligibilityIntro", lang) },
    { tab: "browse" as const, icon: LayoutGrid, title: STRINGS.nav.browse[lang], desc: t("searchPlaceholder", lang) },
  ];

  return (
    <div className="space-y-6">
      <Hero lang={lang} schemeCount={schemes.length} categoryCount={categories.length} onNavigate={onNavigate} />

      <div className="grid gap-4 sm:grid-cols-3">
        {actions.map(({ tab, icon: Icon, title, desc }) => (
          <div key={tab} className="glass-interactive p-5">
            <button onClick={() => onNavigate(tab)} className="text-left">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green to-brand-greenDark text-white shadow">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white">{title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{desc}</p>
            </button>
          </div>
        ))}
      </div>

      {featured.length > 0 && (
        <div>
          <h2 className="mb-3 px-1 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            ⭐ Featured schemes
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {featured.map((s) => (
              <div key={s.id} className="glass-interactive p-5">
                <button onClick={() => onViewScheme(s)} className="text-left">
                  <span className="chip">{lang === "ta" ? s.category_ta : s.category}</span>
                  <h3 className="mt-2 font-tamil font-bold text-slate-800 dark:text-white">
                    {lang === "ta" ? s.name_ta : s.name_en}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                    {lang === "ta" ? s.summary_ta : s.summary_en}
                  </p>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
