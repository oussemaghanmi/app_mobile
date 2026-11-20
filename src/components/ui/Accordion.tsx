import { useId, useState, type ReactNode } from 'react';

interface Props {
  title: ReactNode;
  icon?: string;
  defaultOpen?: boolean;
  /** Met la section en avant (bordure terracotta). */
  highlight?: boolean;
  children: ReactNode;
}

/** Section repliable accessible (bouton aria-expanded + région). */
export function Accordion({ title, icon, defaultOpen = false, highlight = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className={`rounded-2xl bg-white shadow-sm ${highlight ? 'border-s-4 border-terracotta' : ''}`}>
      <h3 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-region`}
          id={`${id}-button`}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-start font-serif text-lg"
        >
          {icon && (
            <span aria-hidden className="text-xl">
              {icon}
            </span>
          )}
          <span className="flex-1">{title}</span>
          <span aria-hidden className={`text-sage-dark transition-transform ${open ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </button>
      </h3>
      {open && (
        <div id={`${id}-region`} role="region" aria-labelledby={`${id}-button`} className="px-4 pb-4">
          {children}
        </div>
      )}
    </section>
  );
}
