import { InjectionToken } from '@angular/core';

export interface EnvironmentConfig {
  apiUrl: string;
  nemotronUrl: string;
  production: boolean;
}

export const ENVIRONMENT_CONFIG = new InjectionToken<EnvironmentConfig>('ENVIRONMENT_CONFIG');