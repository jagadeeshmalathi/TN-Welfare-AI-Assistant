import { useEffect } from "react";
import { X, ExternalLink, FileText, CheckCircle2, MapPin, ArrowRight } from "@/lib/icons";
import { t, schemeName, schemeSummary, schemeBenefit, schemeCategory, schemeEligibility, schemeHowTo } from "@/lib/i18n";
import { formatINR } from "@/lib/utils";
import type { Lang, Scheme } from "@/types";

interface Props {
  scheme: Scheme | null;
  lang: Lang;
  onClose: () => void;
}

/** Full-detail modal for a single scheme. */
export function SchemeDetailModal({ scheme, lang, onClose }: Props) {
  useEffect(() => {
    if (!scheme) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [scheme, onClose]);

  if (!scheme) return null;
  const amount = formatINR(scheme.benefit_amount);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={schemeName(scheme, lang)}
    >
      <div
        className="glass-strong scroll-slim max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-b-none rounded-t-4xl p-6 sm:rounded-4xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <span className="chip">{schemeCategory(scheme, lang)}</span>
            <h2 className="mt-3 font-tamil text-2xl font-bold text-slate-800 dark:text-white">
              {schemeName(scheme, lang)}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-slate-500 transition hover:bg-white/50 dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-slate-600 dark:text-slate-300">{schemeSummary(scheme, lang)}</p>

        {/* Benefit */}
        <div className="mt-5 rounded-2xl border-l-4 border-brand-green bg-gradient-to-r from-brand-green/10 to-brand-orange/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-greenDark dark:text-emerald-300">
              {t("benefit", lang)}
            </p>
            {amount && (
              <span className="rounded-full bg-brand-green px-3 py-1 text-sm font-bold text-white">
                {amount}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-200">
            {schemeBenefit(scheme, lang)}
          </p>
        </div>

        {/* Eligibility */}
        <Section icon={<CheckCircle2 className="h-4 w-4" />} title={t("eligibility", lang)}>
          <ul className="space-y-1.5">
            {schemeEligibility(scheme, lang).map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-200">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-orange" />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        {/* Documents */}
        <Section icon={<FileText className="h-4 w-4" />} title={t("documents", lang)}>
          <div className="flex flex-wrap gap-2">
            {scheme.documents_required_en.map((doc, i) => (
              <span
                key={i}
                className="rounded-xl border border-white/40 bg-white/40 px-3 py-1.5 text-xs text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
              >
                {doc}
              </span>
            ))}
          </div>
        </Section>

        {/* How to apply */}
        <Section icon={<ArrowRight className="h-4 w-4" />} title={t("howToApply", lang)}>
          <p className="text-sm text-slate-700 dark:text-slate-200">{schemeHowTo(scheme, lang)}</p>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
            <MapPin className="h-4 w-4 text-brand-orange" />
            {t("applyTo", lang)}: {scheme.apply_to}
          </p>
        </Section>

        <a
          href={scheme.source_url}
          target="_blank"
          rel="noreferrer noopener"
          className="btn-primary mt-6 w-full"
        >
          {t("applyNow", lang)}
          <ExternalLink className="h-4 w-4" />
        </a>
        <p className="mt-2 text-center text-xs text-slate-400">{scheme.source_name}</p>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
        <span className="text-brand-greenDark dark:text-emerald-300">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}
