import { Sparkles, MessageCircle, ClipboardCheck } from "@/lib/icons";
import { STRINGS, t } from "@/lib/i18n";
import type { Lang } from "@/types";
import type { TabKey } from "./Sidebar";

interface Props {
  lang: Lang;
  schemeCount: number;
  categoryCount: number;
  onNavigate: (tab: TabKey) => void;
}

/** Landing hero with welcome, stats and primary CTAs. */
export function Hero({ lang, schemeCount, categoryCount, onNavigate }: Props) {
  const stats = [
    { value: schemeCount || "10", label: t("statSchemes", lang) },
    { value: categoryCount || "7", label: t("statCategories", lang) },
    { value: "₹0", label: t("statFree", lang) },
  ];

  return (
    <section className="relative overflow-hidden rounded-4xl border border-white/40 bg-gradient-to-br from-brand-green/90 via-brand-greenDark/85 to-brand-orange/85 p-8 text-white shadow-2xl sm:p-12">
      {/* Decorative temple/lotus watermarks */}
      <div className="pointer-events-none absolute -right-6 -top-6 text-[10rem] opacity-15 animate-float select-none">
        🛕
      </div>
      <div className="pointer-events-none absolute -bottom-8 right-24 text-[7rem] opacity-10 select-none">
        🌾
      </div>

      <div className="relative max-w-2xl">
        <span className="chip mb-4 bg-white/20 text-white">
          <Sparkles className="h-3.5 w-3.5" />
          {t("welcome", lang)} 🙏
        </span>
        <h1 className="font-tamil text-3xl font-extrabold leading-tight sm:text-5xl">
          {t("heroTitle", lang)}
        </h1>
        <p className="mt-4 max-w-xl text-base text-white/90 sm:text-lg">{t("heroSub", lang)}</p>

        <div className="mt-7 flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate("chat")}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-brand-greenDark shadow-lg transition hover:scale-[1.03] active:scale-95"
          >
            <MessageCircle className="h-5 w-5" />
            {STRINGS.nav.chat[lang]}
          </button>
          <button
            onClick={() => onNavigate("eligibility")}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/50 bg-white/15 px-5 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/25"
          >
            <ClipboardCheck className="h-5 w-5" />
            {t("checkEligibility", lang)}
          </button>
        </div>

        {/* Stats */}
        <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/25 bg-white/15 px-3 py-4 text-center backdrop-blur"
            >
              <p className="text-2xl font-extrabold">{s.value}</p>
              <p className="mt-1 text-xs font-medium text-white/85">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
