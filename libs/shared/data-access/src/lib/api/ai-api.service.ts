import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';

export interface GenerateLogicResponse {
  success: boolean;
  data: string;
}

export interface AnalyzeApiResponse {
  success: boolean;
  data: string;
}

@Injectable({ providedIn: 'root' })
export class AiApiService extends BaseApiService {
  constructor(http: HttpClient, @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig) {
    super(http, env);
  }

  generateLogic(prompt: string): Observable<GenerateLogicResponse> {
    return this.post<GenerateLogicResponse>(API_CONFIG.endpoints.ai.generateLogic, { prompt });
  }

  analyzeApi(): Observable<AnalyzeApiResponse> {
    return this.get<AnalyzeApiResponse>(API_CONFIG.endpoints.ai.analyzeApi);
  }
}
