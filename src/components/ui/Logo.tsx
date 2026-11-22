/**
 * Logo CronCare : deux feuilles (sauge et terracotta) qui forment un cœur, sur fond crème.
 * Décoratif : le nom de l'application est toujours écrit à côté.
 */
export function Logo({ className = 'h-16 w-16' }: { className?: string }) {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 64 64" className={className}>
      <rect width="64" height="64" rx="18" fill="#faf6ef" />
      {/* Feuille gauche (sauge) */}
      <path d="M32 52C20 44 12 36 12 26a10 10 0 0 1 20-2z" fill="#7a9e7e" />
      {/* Feuille droite (terracotta) */}
      <path d="M32 52c12-8 20-16 20-26a10 10 0 0 0-20-2z" fill="#c8775a" />
      {/* Nervure centrale */}
      <path
        d="M32 24v26M32 36l-8-6M32 42l8-6"
        stroke="#faf6ef"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
