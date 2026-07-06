import { Injectable, inject } from '@angular/core';
import { UserApiService } from '@serveiq/shared/data-access';
import { UiThemeVariant } from '@serveiq/shared/models';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

const STORAGE_KEY = 'ui_theme_variant';

@Injectable({ providedIn: 'root' })
export class ThemePreferenceService {
  private userApi = inject(UserApiService);

  getPreference(): UiThemeVariant {
    return (localStorage.getItem(STORAGE_KEY) as UiThemeVariant) || 'current';
  }

  refreshFromApi(): Observable<UiThemeVariant> {
    return this.userApi.getMe().pipe(
      map(user => {
        if (user.uiThemeVariant) {
          localStorage.setItem(STORAGE_KEY, user.uiThemeVariant);
          return user.uiThemeVariant;
        }
        return this.getPreference();
      }),
      catchError(() => {
        return of(this.getPreference());
      })
    );
  }

  setPreference(variant: UiThemeVariant): void {
    localStorage.setItem(STORAGE_KEY, variant);
  }
}
