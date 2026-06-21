import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Table } from '../models';

@Injectable({ providedIn: 'root' })
export class TableService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'https://serveiq-backend.onrender.com/api/v1';

  getTables(): Observable<Table[]> {
    return this.http.get<Table[]>(`${this.baseUrl}/tables`);
  }

  createTable(payload: { table_number: string; label?: string; capacity: number }): Observable<Table> {
    return this.http.post<Table>(`${this.baseUrl}/tables`, payload);
  }

  getTable(id: string): Observable<Table> {
    return this.http.get<Table>(`${this.baseUrl}/tables/${id}`);
  }

  updateTable(id: string, payload: Partial<Table>): Observable<Table> {
    return this.http.put<Table>(`${this.baseUrl}/tables/${id}`, payload);
  }

  updateTableStatus(id: string, status: 'available' | 'occupied' | 'reserved'): Observable<Table> {
    return this.http.put<Table>(`${this.baseUrl}/tables/${id}/status`, { status });
  }
}
