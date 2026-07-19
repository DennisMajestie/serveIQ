import { Injectable, signal, inject } from '@angular/core';
import { RolesApiService } from '@serveiq/shared/data-access';
import { Observable, ReplaySubject, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private rolesApi = inject(RolesApiService);

  private permissionCodes = signal<Set<string>>(new Set());
  readonly permissionsLoaded = signal(false);
  private load$: Observable<{ permissions: string[] }> | null = null;

  loadPermissions(): Observable<{ permissions: string[] }> {
    if (this.permissionsLoaded()) {
      return new Observable(sub => {
        sub.next({ permissions: [...this.permissionCodes()] });
        sub.complete();
      });
    }
    if (!this.load$) {
      const subject = new ReplaySubject<{ permissions: string[] }>(1);
      this.load$ = subject.asObservable();
      this.rolesApi.getMyPermissions().subscribe({
        next: res => {
          this.permissionCodes.set(new Set(res.permissions));
          this.permissionsLoaded.set(true);
          subject.next(res);
          subject.complete();
        },
        error: () => {
          this.permissionCodes.set(new Set());
          this.permissionsLoaded.set(true);
          subject.next({ permissions: [] });
          subject.complete();
        }
      });
    }
    return this.load$;
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
