import { useState } from "react";
import { ClipboardCheck, Loader2, Award, ChevronRight, RotateCcw } from "@/lib/icons";
import { useEligibility } from "@/hooks/useEligibility";
import { DISABILITY_TYPES, PURPOSES, t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { EligibilityForm, Lang, Scheme } from "@/types";
import { api } from "@/lib/api";

interface Props {
  lang: Lang;
  onViewScheme: (scheme: Scheme) => void;
}

const scoreColor = (score: number) =>
  score >= 85 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-slate-500";
const scoreRing = (score: number) =>
  score >= 85 ? "from-brand-green to-brand-greenDark" : score >= 60 ? "from-brand-gold to-brand-orange" : "from-slate-400 to-slate-500";

export function EligibilityTab({ lang, onViewScheme }: Props) {
  const { results, loading, error, check, reset } = useEligibility();
  const [form, setForm] = useState<EligibilityForm>({
    disability_type: "physical",
    disability_percent: 40,
    age: 30,
    purpose: "financial",
  });

  const update = <K extends keyof EligibilityForm>(key: K, value: EligibilityForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="glass p-6 lg:col-span-2">
        <div className="mb-1 flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-brand-greenDark" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {t("checkEligibility", lang)}
          </h2>
        </div>
        <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
          {t("eligibilityIntro", lang)}
        </p>

        <div className="space-y-4">
          <Field label={t("disabilityType", lang)}>
            <select className="input-glass" value={form.disability_type} onChange={(e) => update("disability_type", e.target.value)}>
              {DISABILITY_TYPES.map((d) => (
                <option key={d.value} value={d.value}>{d[lang]}</option>
              ))}
            </select>
          </Field>

          <Field label={`${t("disabilityPercent", lang)}: ${form.disability_percent}%`}>
            <input type="range" min={0} max={100} step={5} value={form.disability_percent}
              onChange={(e) => update("disability_percent", Number(e.target.value))}
              className="w-full accent-brand-green" />
          </Field>

          <Field label={t("age", lang)}>
            <input type="number" min={0} max={120} className="input-glass" value={form.age}
              onChange={(e) => update("age", Number(e.target.value))} />
          </Field>

          <Field label={t("purpose", lang)}>
            <select className="input-glass" value={form.purpose} onChange={(e) => update("purpose", e.target.value)}>
              {PURPOSES.map((p) => (
                <option key={p.value} value={p.value}>{p[lang]}</option>
              ))}
            </select>
          </Field>

          <div className="flex gap-2 pt-1">
            <button onClick={() => check(form)} disabled={loading} className="btn-primary flex-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
              {t("checkEligibility", lang)}
            </button>
            {results && (
              <button onClick={reset} className="btn-ghost" aria-label="Reset">
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </div>

      <div className="lg:col-span-3">
        {!results && !loading && (
          <div className="glass flex h-full min-h-[20rem] flex-col items-center justify-center p-8 text-center">
            <div className="mb-3 text-5xl">🎯</div>
            <p className="text-slate-500 dark:text-slate-300">{t("eligibilityIntro", lang)}</p>
          </div>
        )}

        {results && (
          <div className="space-y-3">
            <h3 className="px-1 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t("results", lang)} · {results.length}
            </h3>
            {results.map((r, idx) => (
              <ResultCard key={r.scheme_id} rank={idx + 1} match={r} lang={lang}
                onView={async () => onViewScheme(await api.getScheme(r.scheme_id))} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      {children}
    </label>
  );
}

function ResultCard({ rank, match, lang, onView }: {
  rank: number;
  match: import("@/types").EligibilityMatch;
  lang: Lang;
  onView: () => void;
}) {
  return (
    <div className="glass animate-fade-in-up p-5">
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center">
          <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg", scoreRing(match.score))}>
            <span className="text-lg font-extrabold">{match.score}</span>
          </div>
          <span className={cn("mt-1 text-[10px] font-bold uppercase", scoreColor(match.score))}>
            {t("match", lang)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {rank === 1 && <Award className="h-4 w-4 text-brand-gold" />}
            <h4 className="font-tamil font-bold text-slate-800 dark:text-white">
              {lang === "ta" ? match.name_ta : match.name_en}
            </h4>
          </div>
          <span className="chip mt-1">{match.category}</span>
          <ul className="mt-2 space-y-1">
            {match.reasons.slice(0, 3).map((reason, i) => (
              <li key={i} className="flex gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-brand-green" />
                {reason}
              </li>
            ))}
          </ul>
          <button onClick={onView}
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-greenDark hover:gap-2 dark:text-emerald-400">
            {t("learnMore", lang)} <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
