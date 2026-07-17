import { Injectable, signal, inject } from '@angular/core';
import { RolesApiService } from '@serveiq/shared/data-access';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private rolesApi = inject(RolesApiService);

  private permissionCodes = signal<Set<string>>(new Set());
  readonly permissionsLoaded = signal(false);

  loadPermissions() {
    this.rolesApi.getMyPermissions().subscribe({
      next: (res) => {
        this.permissionCodes.set(new Set(res.permissions));
        this.permissionsLoaded.set(true);
      },
      error: () => {
        this.permissionCodes.set(new Set());
        this.permissionsLoaded.set(true);
      }
    });
  }

  hasPermission(code: string): boolean {
    return this.permissionCodes().has(code);
  }

  hasAnyPermission(codes: string[]): boolean {
    const set = this.permissionCodes();
    return codes.some(c => set.has(c));
  }

  hasAllPermissions(codes: string[]): boolean {
    const set = this.permissionCodes();
    return codes.every(c => set.has(c));
  }
}
