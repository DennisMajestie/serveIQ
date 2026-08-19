import { Injectable, signal, inject } from '@angular/core';
import { AuthService, MeResponse } from '@serveiq/shared/data-access';
import { Observable, ReplaySubject, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private authService = inject(AuthService);

  private permissionCodes = signal<Set<string>>(new Set());
  readonly permissionsLoaded = signal(false);
  readonly meLoaded = signal(false);
  private me = signal<MeResponse | null>(null);
  private load$: Observable<{ permissions: string[] }> | null = null;

  private normalizeRole(role: string | null | undefined): string {
    if (!role) return '';
    const r = role.toLowerCase();
    if (r === 'superadmin' || r === 'super_admin') return 'super_admin';
    if (r === 'owner') return 'owner';
    if (r === 'manager') return 'manager';
    if (r === 'supervisor') return 'supervisor';
    if (r === 'waiter') return 'waiter';
    if (r === 'chef') return 'chef';
    if (r === 'cashier') return 'cashier';
    return r;
  }

  /** Returns the authoritative role from the backend /auth/me endpoint */
  getRole(): string {
    const m = this.me();
    if (m) return this.normalizeRole(m.role);
    return this.normalizeRole(localStorage.getItem('userRole'));
  }

  isSuperAdmin(): boolean {
    return this.getRole() === 'super_admin';
  }

  isOwner(): boolean {
    const r = this.getRole();
    return r === 'owner' || r === 'super_admin';
  }

  isManagerOrOwner(): boolean {
    const r = this.getRole();
    return r === 'owner' || r === 'manager' || r === 'super_admin';
  }

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
      this.authService.getMe().subscribe({
        next: me => {
          this.me.set(me);
          this.permissionCodes.set(new Set(me.permissions));
          this.permissionsLoaded.set(true);
          this.meLoaded.set(true);
          subject.next({ permissions: me.permissions });
          subject.complete();
        },
        error: () => {
          this.permissionCodes.set(new Set());
          this.permissionsLoaded.set(true);
          this.meLoaded.set(true);
          subject.next({ permissions: [] });
          subject.complete();
        }
      });
    }
    return this.load$;
  }

  hasPermission(code: string): boolean {
    if (this.isOwner() || this.isSuperAdmin()) return true;
    return this.permissionCodes().has(code);
  }

  hasAnyPermission(codes: string[]): boolean {
    if (this.isOwner() || this.isSuperAdmin()) return true;
    const set = this.permissionCodes();
    return codes.some(c => set.has(c));
  }

  hasAllPermissions(codes: string[]): boolean {
    if (this.isOwner() || this.isSuperAdmin()) return true;
    const set = this.permissionCodes();
    return codes.every(c => set.has(c));
  }

  refresh(): void {
    this.permissionCodes.set(new Set());
    this.permissionsLoaded.set(false);
    this.meLoaded.set(false);
    this.me.set(null);
    this.load$ = null;
  }
}