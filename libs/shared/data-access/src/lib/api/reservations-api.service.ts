import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import {
  Reservation,
  CreateReservationRequest,
  UpdateReservationRequest,
  ReservationQuery,
  AvailabilityQuery,
  AvailabilityResponse,
  WalkinReservationRequest,
} from '@serveiq/shared/models';

@Injectable({ providedIn: 'root' })
export class ReservationsApiService extends BaseApiService {
  constructor(
    http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig
  ) {
    super(http, env);
  }

  // ===== PUBLIC ENDPOINTS (no auth) =====

  /** Check available time slots for a date/party size (public) */
  checkAvailability(query: AvailabilityQuery): Observable<AvailabilityResponse> {
    const params: Record<string, string> = {
      date: query.date,
      party_size: String(query.partySize),
    };
    if (query.branchId) params['branch_id'] = query.branchId;
    return this.get<AvailabilityResponse>(API_CONFIG.endpoints.reservations.availability, undefined, params);
  }

  /** Create a reservation from the public menu (branch id via query param) */
  create(data: CreateReservationRequest, branchId?: string): Observable<Reservation> {
    const qs = branchId ? `?branch_id=${encodeURIComponent(branchId)}` : '';
    const url = `${API_CONFIG.endpoints.reservations.create}${qs}`;
    return this.post<Reservation>(url, data);
  }

  /** Confirm reservation by confirmation code (public) */
  confirmByCode(code: string): Observable<Reservation> {
    return this.get<Reservation>(buildUrl(API_CONFIG.endpoints.reservations.confirm, { code }));
  }

  /** Cancel reservation by confirmation code (public) */
  cancelByCode(code: string, reason: string): Observable<Reservation> {
    return this.post<Reservation>(buildUrl(API_CONFIG.endpoints.reservations.cancel, { code }), { reason });
  }

  /** Look up reservation by confirmation code (public) */
  lookupByCode(code: string): Observable<Reservation> {
    return this.get<Reservation>(buildUrl(API_CONFIG.endpoints.reservations.lookup, { code }));
  }

  // ===== ADMIN/MANAGER ENDPOINTS =====

  /** List reservations (manager view) */
  list(query: ReservationQuery = {}): Observable<Reservation[]> {
    const params: Record<string, string> = {};
    if (query.branchId) params['branch_id'] = query.branchId;
    if (query.tableId) params['table_id'] = query.tableId;
    if (query.status) params['status'] = query.status;
    if (query.from) params['from'] = query.from;
    if (query.to) params['to'] = query.to;
    if (query.search) params['search'] = query.search;
    if (query.limit) params['limit'] = String(query.limit);
    if (query.offset) params['offset'] = String(query.offset);
    return this.get<Reservation[]>(API_CONFIG.endpoints.reservations.list, undefined, params);
  }

  /** Get today's reservation summary */
  getTodaySummary(branchId?: string): Observable<{
    upcoming: number;
    seated: number;
    completed: number;
    pending: number;
    walkins: number;
  }> {
    const params = branchId ? { branch_id: branchId } : undefined;
    return this.get<any>(API_CONFIG.endpoints.reservations.today, undefined, params);
  }

  /** Get reservation by ID */
  getById(id: string): Observable<Reservation> {
    return this.get<Reservation>(buildUrl(API_CONFIG.endpoints.reservations.get, { id }));
  }

  /** Create walk-in reservation (seats immediately) */
  createWalkin(data: WalkinReservationRequest): Observable<Reservation> {
    return this.post<Reservation>(API_CONFIG.endpoints.reservations.walkin, data);
  }

  /** Update reservation */
  update(id: string, data: UpdateReservationRequest): Observable<Reservation> {
    return this.patch<Reservation>(buildUrl(API_CONFIG.endpoints.reservations.update, { id }), data);
  }

  /** Seat a confirmed reservation (creates tab) */
  seat(id: string): Observable<Reservation> {
    return this.patch<Reservation>(buildUrl(API_CONFIG.endpoints.reservations.seat, { id }), {});
  }

  /** Manually trigger reservation reminders */
  sendReminders(): Observable<{ sent: number }> {
    return this.post<{ sent: number }>(API_CONFIG.endpoints.reservations.reminders, {});
  }
}