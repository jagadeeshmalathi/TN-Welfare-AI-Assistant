import { Search, Loader2, ChevronRight, Tag } from "@/lib/icons";
import { useSchemes } from "@/hooks/useSchemes";
import { t, schemeName, schemeSummary, schemeBenefit, schemeCategory } from "@/lib/i18n";
import { formatINR, cn } from "@/lib/utils";
import type { Lang, Scheme } from "@/types";

interface Props {
  lang: Lang;
  onViewScheme: (scheme: Scheme) => void;
}

export function BrowseTab({ lang, onViewScheme }: Props) {
  const { schemes, categories, loading, error, category, setCategory, search, setSearch } = useSchemes();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder", lang)} className="input-glass pl-11"
            aria-label={t("searchPlaceholder", lang)} />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="input-glass sm:w-56" aria-label={t("allCategories", lang)}>
          <option value="all">{t("allCategories", lang)}</option>
          {categories.map((c) => (
            <option key={c.en} value={c.en}>{lang === "ta" ? c.ta : c.en}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : schemes.length === 0 ? (
        <div className="glass p-10 text-center text-slate-500">{t("noResults", lang)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {schemes.map((s) => (
            <SchemeCard key={s.id} scheme={s} lang={lang} onView={() => onViewScheme(s)} />
          ))}
        </div>
      )}
    </div>
  );
}

function SchemeCard({ scheme, lang, onView }: { scheme: Scheme; lang: Lang; onView: () => void }) {
  const amount = formatINR(scheme.benefit_amount);
  return (
    <div className="glass-interactive flex animate-fade-in-up flex-col p-5">
      <button onClick={onView} className="flex h-full flex-col text-left">
        <div className="mb-3 flex items-start justify-between gap-2">
          <span className="chip">
            <Tag className="h-3 w-3" />
            {schemeCategory(scheme, lang)}
          </span>
          {amount && (
            <span className="rounded-full bg-brand-green/15 px-2.5 py-1 text-xs font-bold text-brand-greenDark dark:text-emerald-300">
              {amount}
            </span>
          )}
        </div>

        <h3 className="font-tamil text-base font-bold leading-snug text-slate-800 dark:text-white">
          {schemeName(scheme, lang)}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
          {schemeSummary(scheme, lang)}
        </p>

        <p className={cn("mt-3 line-clamp-2 rounded-xl bg-gradient-to-r from-brand-green/10 to-transparent px-3 py-2 text-xs text-slate-600 dark:text-slate-300")}>
          💡 {schemeBenefit(scheme, lang)}
        </p>

        <span className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-greenDark dark:text-emerald-400">
          {t("learnMore", lang)} <ChevronRight className="h-4 w-4" />
        </span>
      </button>
    </div>
  );
}
