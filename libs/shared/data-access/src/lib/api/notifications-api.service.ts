import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG, buildUrl } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';
import { Notification } from '@serveiq/shared/models';

@Injectable({ providedIn: 'root' })
export class NotificationsApiService extends BaseApiService {
  constructor(http: HttpClient, @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig) {
    super(http, env);
  }

  list(): Observable<Notification[]> {
    return this.get<Notification[]>(API_CONFIG.endpoints.notifications.list);
  }

  getUnread(): Observable<Notification[]> {
    return this.get<Notification[]>(API_CONFIG.endpoints.notifications.unread);
  }

  markRead(id: string): Observable<Notification> {
    return this.patch<Notification>(buildUrl(API_CONFIG.endpoints.notifications.read, { id }), {});
  }

  markAllRead(): Observable<void> {
    return this.patch<void>(API_CONFIG.endpoints.notifications.readAll, {});
  }
}
