import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { osmEmbedUrl, osmLink } from '../map';
import type { Store } from '../types';

/** Carte des magasins (iframe OpenStreetMap) filtrée par ville, avec la liste accessible. */
export function StoresMap({ stores }: { stores: Store[] }) {
  const { t } = useTranslation();
  const cities = useMemo(() => [...new Set(stores.map((s) => s.city))].sort(), [stores]);
  const [city, setCity] = useState(cities[0] ?? '');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const inCity = stores.filter((s) => s.city === city);
  const selected = inCity.find((s) => s.id === selectedId) ?? inCity[0];

  if (!inCity.length) return null;
  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium">
        {t('nutrition.city')}
        <select
          className="input mt-1 min-h-11"
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setSelectedId(null);
          }}
        >
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <iframe
        title={t('nutrition.mapTitle', { city })}
        src={osmEmbedUrl(inCity, selected)}
        className="h-64 w-full rounded-2xl border-0 shadow-sm"
        loading="lazy"
      />
      <ul className="flex flex-col gap-2">
        {inCity.map((s) => (
          <li key={s.id}>
            <div
              className={`card flex items-center gap-3 ${selected?.id === s.id ? 'ring-2 ring-sage' : ''}`}
            >
              <button
                className="min-h-11 flex-1 text-start"
                onClick={() => setSelectedId(s.id)}
                aria-pressed={selected?.id === s.id}
              >
                <span className="block font-medium">{s.name}</span>
                <span className="block text-sm text-ink/60">
                  {t(`nutrition.storeKind.${s.kind}`)}
                  {s.address ? ` · ${s.address}` : ''}
                </span>
              </button>
              <a
                href={osmLink(s)}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 items-center text-sm text-sage-dark underline"
              >
                {t('nutrition.openMap')}
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
