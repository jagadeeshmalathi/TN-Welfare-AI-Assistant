import { cn } from "@/lib/utils";
import type { Lang } from "@/types";
import { NAV_ITEMS, navLabel, type TabKey } from "./Sidebar";

interface Props {
  active: TabKey;
  onSelect: (tab: TabKey) => void;
  lang: Lang;
}

/** Bottom navigation bar for mobile (hidden on large screens). */
export function MobileNav({ active, onSelect, lang }: Props) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/30 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {NAV_ITEMS.map(({ key, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-medium transition-colors",
                isActive
                  ? "text-brand-greenDark dark:text-emerald-400"
                  : "text-slate-500 dark:text-slate-400",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                  isActive && "bg-gradient-to-br from-brand-green to-brand-greenDark text-white shadow",
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              {navLabel(key, lang)}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
