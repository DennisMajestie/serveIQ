import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FeedbackPayload {
  category: 'bug' | 'feature' | 'ux' | 'performance' | 'other';
  message: string;
  screenshot?: string;
  url?: string;
  userAgent?: string;
}

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly baseUrl = `${environment.apiUrl}/api/v1/feedback`;

  constructor(private http: HttpClient) {}

  submit(payload: FeedbackPayload): Observable<any> {
    return this.http.post(this.baseUrl, payload);
  }
}