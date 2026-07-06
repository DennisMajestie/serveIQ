import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { ThemePreferenceService } from './theme-preference.service';

export const prefersCurrentTheme: CanMatchFn = () => {
  const theme = inject(ThemePreferenceService);
  return theme.getPreference() !== 'legacy';
};

export const prefersLegacyTheme: CanMatchFn = () => {
  const theme = inject(ThemePreferenceService);
  return theme.getPreference() === 'legacy';
};
