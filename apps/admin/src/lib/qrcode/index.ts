type QROptions = { width?: number; margin?: number; scale?: number };

export async function toDataURL(text: string, options?: QROptions): Promise<string> {
  const mod = (await import('./browser.js')) as unknown as {
    toDataURL?: (text: string, options?: Record<string, unknown>) => Promise<string>;
    default?: {
      toDataURL?: (text: string, options?: Record<string, unknown>) => Promise<string>;
    };
  };
  const fn = mod.toDataURL ?? mod.default?.toDataURL;
  if (!fn) {
    throw new Error('QR code renderer could not be loaded.');
  }
  return fn(text, {
    width: options?.width,
    margin: options?.margin ?? 4,
    scale: options?.scale ?? 4,
    color: { dark: '#000000ff', light: '#ffffffff' },
    errorCorrectionLevel: 'M',
  });
}