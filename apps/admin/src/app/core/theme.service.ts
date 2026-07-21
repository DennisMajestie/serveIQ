import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'serveiq-admin-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.readInitialTheme());

  constructor() {
    effect(() => {
      const t = this.theme();
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem(STORAGE_KEY, t);
    });
  }

  private readInitialTheme(): Theme {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  toggleTheme(): void {
    this.theme.update(t => (t === 'light' ? 'dark' : 'light'));
  }

  setTheme(t: Theme): void {
    this.theme.set(t);
  }

  /** Read a CSS custom property value from :root at runtime (e.g. '--primary' → '#4be277'). */
  getCssVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  private readonly BRAND_STORAGE_KEY = 'serveiq-brand-colors';

  /** Apply brand colors to CSS custom properties on :root and persist to localStorage. */
  applyBrandColors(primary: string, accent: string): void {
    const root = document.documentElement;
    root.style.setProperty('--primary', primary);
    root.style.setProperty('--secondary', accent);
    localStorage.setItem(this.BRAND_STORAGE_KEY, JSON.stringify({ primary, accent }));
  }

  /** Restore brand colors from localStorage (call on app startup). */
  restoreBrandColors(): void {
    const stored = localStorage.getItem(this.BRAND_STORAGE_KEY);
    if (stored) {
      try {
        const { primary, accent } = JSON.parse(stored);
        const root = document.documentElement;
        root.style.setProperty('--primary', primary);
        root.style.setProperty('--secondary', accent);
      } catch { /* ignore corrupt data */ }
    }
  }
}
