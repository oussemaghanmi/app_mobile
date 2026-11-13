import { osmEmbedUrl, osmLink } from './map';
import { lines } from './types';

describe('carte OpenStreetMap', () => {
  it('encadre les magasins et place un marqueur', () => {
    const url = osmEmbedUrl([
      { lat: 36.8, lon: 10.1 },
      { lat: 36.9, lon: 10.2 },
    ]);
    expect(url).toContain('bbox=10.0800,36.7800,10.2200,36.9200');
    expect(url).toContain('marker=36.8,10.1');
  });
  it('utilise le magasin sélectionné pour le marqueur', () => {
    expect(osmEmbedUrl([{ lat: 1, lon: 2 }], { lat: 3, lon: 4 })).toContain('marker=3,4');
  });
  it('lien vers la fiche', () => {
    expect(osmLink({ lat: 36.8, lon: 10.1 })).toBe(
      'https://www.openstreetmap.org/?mlat=36.8&mlon=10.1#map=17/36.8/10.1',
    );
  });
});

describe('lines', () => {
  it('découpe et nettoie', () => {
    expect(lines('a\n\n b \nc')).toEqual(['a', 'b', 'c']);
  });
});
