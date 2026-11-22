const ICON_FONTS = [
  '24px "Material Icons"',
  '24px "Material Symbols Outlined"',
];

const NO_FONTSET_REVEAL_DELAY_MS = 300;
const FONT_REVEAL_FALLBACK_MS = 1500;

/**
 * Material icon markup holds ligature words (`event_available`) that the webfont
 * swaps for glyphs. Global stylesheets keep that text hidden until `body` carries
 * `fonts-loaded`, so the raw words never reach the page.
 *
 * The gate opens once the webfonts are reported loaded. If they cannot be resolved
 * (for example, the stylesheet is injected after this runs, or a font request
 * fails), it still opens on a short fallback timer: icons hidden forever is worse
 * than a brief flash of the raw ligature words.
 */
export function revealIconsWhenFontReady(): void {
  const reveal = () => document.body.classList.add('fonts-loaded');

  if (!('fonts' in document)) {
    setTimeout(reveal, NO_FONTSET_REVEAL_DELAY_MS);
    return;
  }

  Promise.allSettled(ICON_FONTS.map((font) => document.fonts.load(font))).then(reveal);
  setTimeout(reveal, FONT_REVEAL_FALLBACK_MS);
}
