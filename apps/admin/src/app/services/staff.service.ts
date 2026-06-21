import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Waiter } from '../models';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'https://serveiq-backend.onrender.com/api/v1';

  getWaiters(): Observable<Waiter[]> {
    return this.http.get<Waiter[]>(`${this.baseUrl}/user/waiters`);
  }

  createWaiter(payload: { fullName: string; email?: string; phone?: string; branchId: string }): Observable<Waiter> {
    return this.http.post<Waiter>(`${this.baseUrl}/user/waiters`, payload);
  }

  resetPin(id: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/user/waiters/${id}/reset-pin`, {});
  }

  deleteWaiter(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/user/waiters/${id}`);
  }
}
