import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BusinessService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'https://serveiq-backend.onrender.com/api/v1';

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/businesses/me`);
  }

  updateProfile(payload: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/businesses/me`, payload);
  }
}
