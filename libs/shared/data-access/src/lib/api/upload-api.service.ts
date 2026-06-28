import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
    // Do NOT set Content-Type header — browser sets multipart/form-data with boundary automatically
    const fullUrl = `${this.apiUrl}/api/v1/upload`;
    return this.http.post<any>(fullUrl, formData).pipe(
      map(res => {
        const data = res && typeof res === 'object' && 'data' in res ? res.data : res;
        return { url: data?.url ?? data?.image_url ?? '' };
      })
    );
  }
}

// Alias for backward compatibility during migration
export const UploadService = UploadApiService;
