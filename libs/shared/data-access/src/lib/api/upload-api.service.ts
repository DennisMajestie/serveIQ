import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';

@Injectable({ providedIn: 'root' })
export class UploadApiService extends BaseApiService {
  constructor(
    http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig
  ) {
    super(http, env);
  }

  uploadFile(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.post<{ url: string }>('/api/v1/upload', formData);
  }
}

// Alias for backward compatibility during migration
export const UploadService = UploadApiService;
