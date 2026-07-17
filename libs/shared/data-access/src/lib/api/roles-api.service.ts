import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';

export interface Role {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
}

@Injectable({ providedIn: 'root' })
export class RolesApiService extends BaseApiService {
  private noAuthHttp: HttpClient;

  constructor(
    http: HttpClient,
    handler: HttpBackend,
    @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig
  ) {
    super(http, env);
    this.noAuthHttp = new HttpClient(handler);
  }

  getMyPermissions(): Observable<{ permissions: string[] }> {
    return this.get<{ permissions: string[] }>(API_CONFIG.endpoints.roles.myPermissions);
  }

  listRoles(): Observable<Role[]> {
    return this.get<Role[]>(API_CONFIG.endpoints.roles.list);
  }

  listPermissions(): Observable<Permission[]> {
    return this.get<Permission[]>(API_CONFIG.endpoints.roles.permissions);
  }

  updateRolePermissions(roleId: string, permissionIds: string[]): Observable<Role> {
    return this.put<Role>(`${API_CONFIG.endpoints.roles.list}/${roleId}/permissions`, { permissionIds });
  }
}
