import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';

export interface TabItem<K extends string> {
  key: K;
  label: string;
}

interface Props<K extends string> {
  tabs: TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
  label: string;
  children: ReactNode;
}

/**
 * Onglets accessibles (WAI-ARIA tabs) : flèches gauche/droite (inversées en RTL), Début/Fin.
 * Le panneau actif est rendu par `children`.
 */
export function Tabs<K extends string>({ tabs, active, onChange, label, children }: Props<K>) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const rtl = document.documentElement.dir === 'rtl';
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
    let next: number | null = null;
    if (step) next = (index + step + tabs.length) % tabs.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = tabs.length - 1;
    if (next === null) return;
    e.preventDefault();
    onChange(tabs[next].key);
    refs.current[next]?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label={label} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {tabs.map((tab, i) => {
          const selected = tab.key === active;
          return (
            <button
              key={tab.key}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              id={`${id}-tab-${tab.key}`}
              aria-selected={selected}
              aria-controls={`${id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.key)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-medium transition-colors ${
                selected ? 'bg-sage text-white' : 'bg-white text-ink/70 shadow-sm'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`} className="mt-4">
        {children}
      </div>
    </div>
  );
}
