import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RolesApiService, Role, Permission } from '@serveiq/shared/data-access';
import { PermissionService } from '../core/permission.service';
import { PERMISSIONS } from './permission-codes.const';
import Swal from 'sweetalert2';

interface CategoryGroup {
  category: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent implements OnInit {
  private rolesApi = inject(RolesApiService);
  permService = inject(PermissionService);

  roles = signal<Role[]>([]);
  allPermissions = signal<Permission[]>([]);
  selectedRole = signal<Role | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);

  permissionCategories = computed(() => {
    const perms = this.allPermissions();
    const grouped: CategoryGroup[] = [];
    const map = new Map<string, Permission[]>();
    for (const p of perms) {
      const list = map.get(p.category) || [];
      list.push(p);
      map.set(p.category, list);
    }
    for (const [category, permissions] of map) {
      grouped.push({ category, permissions });
    }
    return grouped;
  });

  ngOnInit() {
    this.permService.loadPermissions();
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.rolesApi.listRoles().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        this.rolesApi.listPermissions().subscribe({
          next: (perms) => {
            this.allPermissions.set(perms);
            this.isLoading.set(false);
            if (roles.length > 0) this.selectedRole.set(roles[0]);
          },
          error: () => this.isLoading.set(false)
        });
      },
      error: () => this.isLoading.set(false)
    });
  }

  selectRole(role: Role) {
    this.selectedRole.set(role);
  }

  hasPermission(permissionId: string): boolean {
    const role = this.selectedRole();
    if (!role) return false;
    return role.permissions.some(p => p.id === permissionId);
  }

  get isOwnerRole(): boolean {
    return this.selectedRole()?.name === 'Owner';
  }

  togglePermission(permissionId: string) {
    const role = this.selectedRole();
    if (!role || role.is_system) return;

    const has = this.hasPermission(permissionId);
    if (has) {
      role.permissions = role.permissions.filter(p => p.id !== permissionId);
    } else {
      const perm = this.allPermissions().find(p => p.id === permissionId);
      if (perm) role.permissions = [...role.permissions, perm];
    }
  }

  saveRole() {
    const role = this.selectedRole();
    if (!role || role.is_system) return;

    this.isSaving.set(true);
    this.rolesApi.updateRolePermissions(role.id, role.permissions.map(p => p.id)).subscribe({
      next: () => {
        this.isSaving.set(false);
        Swal.fire({ icon: 'success', title: 'Permissions Updated', timer: 1500, showConfirmButton: false });
      },
      error: (err) => {
        this.isSaving.set(false);
        const msg = err.error?.message || '';
        if (msg.includes('Cannot modify the Owner role')) {
          Swal.fire({ icon: 'info', title: 'Owner Role Locked', text: 'The Owner role permissions cannot be changed.', timer: 2000, showConfirmButton: false });
          return;
        }
        Swal.fire({ icon: 'error', title: 'Failed to Save', text: msg || 'An error occurred' });
      }
    });
  }
}
