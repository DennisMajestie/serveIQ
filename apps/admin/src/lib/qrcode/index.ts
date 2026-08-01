type QROptions = { width?: number; margin?: number; scale?: number };

export async function toDataURL(text: string, options?: QROptions): Promise<string> {
  const mod = await import('./browser.js');
  return mod.toDataURL(text, {
    width: options?.width,
    margin: options?.margin ?? 4,
    scale: options?.scale ?? 4,
    color: { dark: '#000000ff', light: '#ffffffff' },
    errorCorrectionLevel: 'M',
  });
}