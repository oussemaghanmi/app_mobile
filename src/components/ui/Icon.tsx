/**
 * Jeu d'icônes CronCare (traits 24×24, épaisseur 2, coins arrondis), dessiné pour l'application.
 * Les icônes sont décoratives (`aria-hidden`) : le libellé visible ou l'`aria-label` du bouton porte le sens.
 * `flip` retourne l'icône en RTL (flèches de direction).
 */
const PATHS = {
  home: 'M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9',
  pill: 'M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7zM7 10l7 7',
  journal: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11M9 8h6',
  community:
    'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.5a6.5 6.5 0 0 1 3.5 5.5',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A7.5 7.5 0 0 0 7 6.5l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a7.5 7.5 0 0 0 2.6-1.5l2.4 1 2-3.4z',
  disease: 'M12 6.5C10 4.5 6.5 4 4 5v14c2.5-1 6-.5 8 1.5 2-2 5.5-2.5 8-1.5V5c-2.5-1-6-.5-8 1.5zM12 6.5v14',
  recipes: 'M7 3v7a2 2 0 0 0 4 0V3M9 12v9M17 3c-2 1.5-3 4-3 7h3v11',
  tips: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  bot: 'M4 5h16v11H9l-5 4zM9 10.5h.01M12 10.5h.01M15 10.5h.01',
  check: 'M5 12.5 10 17.5 19 7',
  back: 'M19 12H5M11 6l-6 6 6 6',
  phone:
    'M5 3.5h3.5l1.5 4.5-2 1.5a12 12 0 0 0 6.5 6.5l1.5-2 4.5 1.5V19a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3 5.5a2 2 0 0 1 2-2z',
  alert: 'M12 3 2 20h20zM12 10v4M12 17h.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01',
  heart: 'M12 20s-7.5-4.5-7.5-10A4.5 4.5 0 0 1 12 7.5 4.5 4.5 0 0 1 19.5 10C19.5 15.5 12 20 12 20z',
} as const;

export type IconName = keyof typeof PATHS;

interface Props {
  name: IconName;
  className?: string;
  /** Retourne l'icône en RTL (flèches). */
  flip?: boolean;
}

export function Icon({ name, className = 'h-6 w-6', flip = false }: Props) {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} ${flip ? 'rtl:-scale-x-100' : ''}`}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
