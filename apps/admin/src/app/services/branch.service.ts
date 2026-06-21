import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Branch, DashboardStats } from '../models';

@Injectable({ providedIn: 'root' })
export class BranchService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'https://serveiq-backend.onrender.com/api/v1';

  getBranches(): Observable<Branch[]> {
    return this.http.get<Branch[]>(`${this.baseUrl}/branches`);
  }

  createBranch(payload: { name: string; address: string; phone_number: string; location?: string }): Observable<Branch> {
    return this.http.post<Branch>(`${this.baseUrl}/branches`, payload);
  }

  getBranch(id: string): Observable<Branch> {
    return this.http.get<Branch>(`${this.baseUrl}/branches/${id}`);
  }

  updateBranch(id: string, payload: Partial<Branch>): Observable<Branch> {
    return this.http.patch<Branch>(`${this.baseUrl}/branches/${id}`, payload);
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/branches/dashboard/stats`);
  }
}
