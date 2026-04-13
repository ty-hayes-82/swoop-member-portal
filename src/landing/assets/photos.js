// Verified public Unsplash photo IDs (HTTP 200, April 2026).
// Hotlinked via the Unsplash CDN with auto=format (serves AVIF/WebP when
// the browser supports it) + fit=crop + a responsive w= query.
// Callers should render via <LandingImage> which emits a srcset over these widths.

export const WIDTHS = [480, 800, 1200, 1600, 2000];

const url = (id, w = 1200, q = 72) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=${q}`;

export const photos = {
  heroCourse:    { id: '1587174486073-ae5e5cff23aa', alt: 'Golf course fairway at sunrise' },
  clubhouse:     { id: '1535131749006-b7f58c99034b', alt: 'Stone clubhouse exterior' },
  fairwayGreen:  { id: '1592919505780-303950717480', alt: 'Golf course fairway toward the green' },
  teeBoxMorning: { id: '1587381420270-3e1a5b9e6904', alt: 'Tee box with flag on a morning round' },
  putting:       { id: '1593113616828-6f22bca04804', alt: 'Putting green close up' },
  clubhouseDusk: { id: '1535132011086-b8818f016104', alt: 'Clubhouse at dusk' },
  proShop:       { id: '1624571409108-e9a41746af53', alt: 'Pro shop interior' },
  cartPath:      { id: '1600628421055-4d30de868b8f', alt: 'Golf cart on course path' },
  dining:        { id: '1606166187734-a4cb74079037', alt: 'Club dining room' },
};

export function photoUrl(key, width = 1200) {
  const p = photos[key];
  if (!p) return '';
  return url(p.id, width);
}

export function photoSrcSet(key) {
  const p = photos[key];
  if (!p) return '';
  return WIDTHS.map((w) => `${url(p.id, w)} ${w}w`).join(', ');
}

export function photoAlt(key) {
  return photos[key]?.alt || '';
}
