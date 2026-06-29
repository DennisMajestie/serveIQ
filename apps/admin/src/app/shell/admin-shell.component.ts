import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SyncStore } from '@serveiq/data-access';
import { AuthService } from '@serveiq/shared/data-access';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-shell">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h1 class="brand-name">RestoAdmin</h1>
          <p class="brand-subtitle">Management Portal</p>
        </div>
        <nav class="sidebar-nav">
          <ul class="nav-list">
            <li class="nav-item">
              <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">
                <span class="material-symbols-outlined">dashboard</span>
                <span>Dashboard</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/tables" routerLinkActive="active">
                <span class="material-symbols-outlined">table_restaurant</span>
                <span>Tables</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/menu" routerLinkActive="active">
                <span class="material-symbols-outlined">restaurant_menu</span>
                <span>Menu</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/staff" routerLinkActive="active">
                <span class="material-symbols-outlined">group</span>
                <span>Staff</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/settings" routerLinkActive="active">
                <span class="material-symbols-outlined">settings</span>
                <span>Settings</span>
              </a>
            </li>
          </ul>
        </nav>
        <div class="sidebar-footer">
          <button class="logout-btn" (click)="logout()">
            <span class="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="main-content-wrapper">
        <!-- Top Nav -->
        <header class="top-nav">
          <div class="search-container">
            <span class="material-symbols-outlined">search</span>
            <input type="text" placeholder="Search orders, tables, or staff...">
          </div>
          <div class="top-nav-right">
            <div class="top-nav-actions">
              <button class="icon-btn">
                <span class="material-symbols-outlined">notifications</span>
                <span class="notification-dot"></span>
              </button>
              <button class="icon-btn">
                <span class="material-symbols-outlined">help</span>
                <span class="btn-text">Help</span>
              </button>
            </div>
            <div class="divider"></div>
            <div class="user-profile">
              <div class="user-info">
                <p class="user-name">Marcus Cole</p>
                <p class="user-role">Manager</p>
              </div>
              <img alt="Admin Profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaybusLQmZnunOL2JqdLVUOHNP3YQz-SAlAew7fOiFV3L_wuzBKG5uhzMTAnTwmPJBVAE-tW8LhiM0IfR0R1gDEk19ZAY9ouxL0eNCl4dbbLLL94CsZrtgAkbZ7kjlOPCHuBadffduliQa_BilWO0c6wkLaswj6BKBm7PtpU4x-lWHhyvBYTbX2aWEwxNhfUchW3osXvrPUxWyJq1Ko2kNk7CBujdSeALxFPjFsFribrqzHjloASkDUmQRwq56TpjWROFdrLTeCiN7">
            </div>
          </div>
        </header>

        <!-- Router Outlet -->
        <main class="content-area">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --on-secondary-fixed: #141b2b;
      --on-surface: #151c27;
      --tertiary-container: #00a2f4;
      --error-container: #ffdad6;
      --surface: #f9f9ff;
      --on-primary-fixed-variant: #783200;
      --inverse-on-surface: #ebf1ff;
      --tertiary-fixed: #cde5ff;
      --background: #f9f9ff;
      --surface-container-highest: #dce2f3;
      --primary-fixed-dim: #ffb690;
      --on-background: #151c27;
      --surface-container-low: #f0f3ff;
      --on-tertiary-fixed-variant: #004b74;
      --primary-container: #f97316;
      --surface-container: #e7eefe;
      --on-error-container: #93000a;
      --on-primary-fixed: #341100;
      --on-tertiary-container: #003554;
      --on-error: #ffffff;
      --on-tertiary-fixed: #001d32;
      --on-primary: #ffffff;
      --surface-container-high: #e2e8f8;
      --on-secondary: #ffffff;
      --surface-container-lowest: #ffffff;
      --on-secondary-container: #5c6274;
      --surface-tint: #9d4300;
      --secondary: #575e70;
      --tertiary-fixed-dim: #93ccff;
      --surface-dim: #d3daea;
      --secondary-fixed-dim: #c0c6db;
      --outline: #8c7164;
      --inverse-surface: #2a313d;
      --on-tertiary: #ffffff;
      --on-surface-variant: #584237;
      --error: #ba1a1a;
      --tertiary: #006398;
      --outline-variant: #e0c0b1;
      --on-primary-container: #582200;
      --primary-fixed: #ffdbca;
      --secondary-container: #d9dff5;
      --primary: #9d4300;
      --surface-variant: #dce2f3;
      --surface-bright: #f9f9ff;
      --secondary-fixed: #dce2f7;
      --on-secondary-fixed-variant: #404758;
      --inverse-primary: #ffb690;

      display: block;
      width: 100%;
      height: 100%;
      font-family: 'Inter', sans-serif;
    }

    .material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      vertical-align: middle;
    }

    .admin-shell {
      display: flex;
      width: 100%;
      min-height: 100vh;
    }

    /* Sidebar */
    .sidebar {
      width: 256px;
      height: 100vh;
      position: sticky;
      top: 0;
      left: 0;
      background: var(--surface);
      border-right: 1px solid var(--outline-variant);
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      display: flex;
      flex-direction: column;
      z-index: 50;
    }

    .sidebar-header {
      padding: 32px 24px;
    }

    .brand-name {
      font-size: 24px;
      line-height: 32px;
      font-weight: 700;
      color: var(--primary);
      margin: 0;
    }

    .brand-subtitle {
      font-size: 14px;
      line-height: 20px;
      font-weight: 600;
      color: var(--secondary);
      margin: 4px 0 0;
    }

    .sidebar-nav {
      flex: 1;
    }

    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      width: 100%;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      color: var(--secondary);
      text-decoration: none;
      font-size: 14px;
      line-height: 20px;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .nav-link:hover {
      color: var(--primary);
      background: var(--surface-container-high);
    }

    .nav-link.active {
      color: var(--primary);
      font-weight: 700;
      background: rgba(249, 115, 22, 0.1);
      border-right: 4px solid var(--primary);
    }

    .sidebar-footer {
      padding: 24px;
      margin-top: auto;
    }

    .logout-btn {
      width: 100%;
      height: 48px;
      background: transparent;
      color: var(--error);
      border: 1px solid transparent;
      border-radius: 12px;
      font-size: 14px;
      line-height: 20px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
    }

    .logout-btn:hover {
      background: var(--error-container);
      border-color: var(--error);
    }

    .logout-btn:active {
      transform: scale(0.95);
    }

    /* Main Content */
    .main-content-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .top-nav {
      height: 64px;
      background: var(--surface);
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      position: sticky;
      top: 0;
      z-index: 40;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
    }

    .search-container {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--surface-container-low);
      border: 1px solid var(--outline-variant);
      padding: 8px 16px;
      border-radius: 9999px;
      width: 384px;
      transition: all 0.2s ease;
    }

    .search-container:focus-within {
      box-shadow: 0 0 0 2px var(--primary-container);
      border-color: var(--primary-container);
    }

    .search-container .material-symbols-outlined {
      color: var(--secondary);
    }

    .search-container input {
      background: transparent;
      border: none;
      outline: none;
      width: 100%;
      font-size: 14px;
      line-height: 20px;
      color: var(--on-surface);
      font-family: 'Inter', sans-serif;
    }

    .top-nav-right {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .top-nav-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .icon-btn {
      background: transparent;
      border: none;
      color: var(--secondary);
      cursor: pointer;
      padding: 8px;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s ease;
      position: relative;
    }

    .icon-btn:hover {
      background: var(--surface-container-low);
    }

    .btn-text {
      font-size: 14px;
      line-height: 20px;
      font-weight: 500;
      color: var(--secondary);
    }

    .notification-dot {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 8px;
      height: 8px;
      background: var(--primary);
      border-radius: 9999px;
      border: 2px solid var(--surface);
    }

    .divider {
      height: 32px;
      width: 1px;
      background: var(--outline-variant);
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-left: 8px;
    }

    .user-info {
      text-align: right;
    }

    .user-name {
      font-size: 14px;
      line-height: 20px;
      font-weight: 600;
      margin: 0;
    }

    .user-role {
      font-size: 12px;
      line-height: 16px;
      color: var(--secondary);
      margin: 0;
    }

    .user-profile img {
      width: 40px;
      height: 40px;
      border-radius: 9999px;
      object-fit: cover;
      border: 2px solid rgba(157,67,0,0.2);
    }

    .content-area {
      flex: 1;
      overflow-y: auto;
    }
  `]
})
export class AdminShellComponent {
  sidebarCollapsed = signal(false);
  private authService = inject(AuthService);
  private router = inject(Router);

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
