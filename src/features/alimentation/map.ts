import type { Store } from './types';

/**
 * URL d'intégration OpenStreetMap (iframe) centrée sur des magasins, avec un marqueur
 * sur le magasin sélectionné. Fonctionne dans la WebView Capacitor sans clé d'API.
 */
export function osmEmbedUrl(stores: Pick<Store, 'lat' | 'lon'>[], selected?: Pick<Store, 'lat' | 'lon'>) {
  const pad = 0.02;
  const lats = stores.map((s) => s.lat);
  const lons = stores.map((s) => s.lon);
  const bbox = [
    Math.min(...lons) - pad,
    Math.min(...lats) - pad,
    Math.max(...lons) + pad,
    Math.max(...lats) + pad,
  ]
    .map((n) => n.toFixed(4))
    .join(',');
  const marker = selected ?? stores[0];
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker.lat},${marker.lon}`;
}

export const osmLink = (s: Pick<Store, 'lat' | 'lon'>) =>
  `https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lon}#map=17/${s.lat}/${s.lon}`;
