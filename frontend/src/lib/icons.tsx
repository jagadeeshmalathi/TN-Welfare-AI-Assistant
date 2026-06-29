import type { ReactNode } from "react";

// ponytail: replaces lucide-react; same viewBox/stroke API, tree-shaken by import
type P = { className?: string };
const S = ({ c, children }: { c?: string; children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round" className={c ?? "h-5 w-5"}>
    {children}
  </svg>
);

export const Home          = ({ className: c }: P) => <S c={c}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></S>;
export const MessageCircle = ({ className: c }: P) => <S c={c}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></S>;
export const ClipboardCheck= ({ className: c }: P) => <S c={c}><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></S>;
export const LayoutGrid    = ({ className: c }: P) => <S c={c}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></S>;
export const Moon          = ({ className: c }: P) => <S c={c}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></S>;
export const Sun           = ({ className: c }: P) => <S c={c}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></S>;
export const Send          = ({ className: c }: P) => <S c={c}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></S>;
export const Sparkles      = ({ className: c }: P) => <S c={c}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3ZM5 3v4M19 17v4M3 5h4M17 19h4"/></S>;
export const Bot           = ({ className: c }: P) => <S c={c}><path d="M12 8V4H8M2 14h2M20 14h2M15 13v2M9 13v2"/><rect width="16" height="12" x="4" y="8" rx="2"/></S>;
export const User          = ({ className: c }: P) => <S c={c}><circle cx="12" cy="7" r="4"/><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/></S>;
export const Square        = ({ className: c }: P) => <S c={c}><rect width="14" height="14" x="5" y="5" rx="2"/></S>;
export const BookOpen      = ({ className: c }: P) => <S c={c}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 0 3-3h7z"/></S>;
export const Loader2       = ({ className: c }: P) => <S c={c}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></S>;
export const Award         = ({ className: c }: P) => <S c={c}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></S>;
export const ChevronRight  = ({ className: c }: P) => <S c={c}><path d="m9 18 6-6-6-6"/></S>;
export const RotateCcw     = ({ className: c }: P) => <S c={c}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></S>;
export const Search        = ({ className: c }: P) => <S c={c}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></S>;
export const Tag           = ({ className: c }: P) => <S c={c}><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></S>;
export const X             = ({ className: c }: P) => <S c={c}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></S>;
export const ExternalLink  = ({ className: c }: P) => <S c={c}><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></S>;
export const FileText      = ({ className: c }: P) => <S c={c}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/></S>;
export const CheckCircle2  = ({ className: c }: P) => <S c={c}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></S>;
export const MapPin        = ({ className: c }: P) => <S c={c}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></S>;
export const ArrowRight    = ({ className: c }: P) => <S c={c}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></S>;
