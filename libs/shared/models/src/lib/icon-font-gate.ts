const ICON_FONTS = [
  '24px "Material Icons"',
  '24px "Material Symbols Outlined"',
];

const NO_FONTSET_REVEAL_DELAY_MS = 300;

/**
 * Material icon markup holds ligature words (`event_available`) that the webfont
 * swaps for glyphs. Global stylesheets keep that text hidden until `body` carries
 * `fonts-loaded`, so the raw words never reach the page.
 *
 * The gate must only open when the webfont genuinely arrived. `fonts.ready` and
 * `Promise.allSettled` both settle on failure too, which revealed the words and
 * let them overflow fixed-size icon boxes. `FontFaceSet.load()` resolves with the
 * faces it actually matched, so an empty array is a real failure signal.
 *
 * On failure the icons stay hidden; adjacent text labels carry the meaning.
 */
export function revealIconsWhenFontReady(): void {
  if (!('fonts' in document)) {
    setTimeout(() => document.body.classList.add('fonts-loaded'), NO_FONTSET_REVEAL_DELAY_MS);
    return;
  }

  Promise.all(
    ICON_FONTS.map((font) => document.fonts.load(font).catch(() => [] as FontFace[])),
  ).then((results) => {
    if (results.some((faces) => faces.length > 0)) {
      document.body.classList.add('fonts-loaded');
    } else {
      console.warn('[fonts] Material icon webfonts unavailable — icons hidden.');
    }
  });
}