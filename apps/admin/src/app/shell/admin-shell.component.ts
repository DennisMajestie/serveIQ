import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SyncStore } from '@serveiq/data-access';
import { AuthService, UserApiService, TablesApiService, TabsApiService, User, SubscriptionsApiService, ENVIRONMENT_CONFIG, EnvironmentConfig } from '@serveiq/shared/data-access';
import { SubscriptionService } from '../core/subscription.service';
import { ThemeService } from '../core/theme.service';
import { PermissionService } from '../core/permission.service';
import { of, forkJoin, interval, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, map, catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';

interface SearchResult {
  type: 'table' | 'staff' | 'order';
  label: string;
  subtitle: string;
  route: string;
}

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
      <div class="admin-shell">
      <!-- Impersonation Loader Overlay -->
      <div class="impersonate-overlay" *ngIf="impersLoading()">
        <div class="impersonate-loader">
          <div class="spinner"></div>
          <p>Returning to Super Admin dashboard…</p>
        </div>
      </div>

      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h1 class="brand-name">ServeIQ</h1>
          <p class="brand-subtitle">Management Portal</p>
        </div>
        <nav class="sidebar-nav">
          <ul class="nav-list" *ngIf="profile().role === 'super_admin'">
            <li class="nav-section-label">System</li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/app/admin/dashboard" routerLinkActive="active">
                <span class="material-symbols-outlined">dashboard</span>
                <span>Platform Overview</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/app/admin/businesses" routerLinkActive="active">
                <span class="material-symbols-outlined">business</span>
                <span>Businesses</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/app/admin/payment-providers" routerLinkActive="active">
                <span class="material-symbols-outlined">payments</span>
                <span>Payment Providers</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/app/admin/system-health" routerLinkActive="active">
                <span class="material_symbols-outlined">monitor_heart</span>
                <span>System Health</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/app/admin/audit-logs" routerLinkActive="active">
                <span class="material-symbols-outlined">receipt_long</span>
                <span>Audit Logs</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/app/admin/revenue" routerLinkActive="active">
                <span class="material-symbols-outlined">analytics</span>
                <span>Revenue &amp; Analytics</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/app/admin/plans" routerLinkActive="active">
                <span class="material-symbols-outlined">sell</span>
                <span>Subscription Plans</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/app/autopilot" routerLinkActive="active">
                <span class="material-symbols-outlined">smart_toy</span>
                <span>Autopilot AI</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/app/ads" routerLinkActive="active">
                <span class="material-symbols-outlined">campaign</span>
                <span>Ads</span>
              </a>
            </li>
          </ul>

<ul class="nav-list" *ngIf="permissionService.hasPermission('view_dashboard') && profile().role !== 'super_admin'">
            <li class="nav-item">
              <a class="nav-link" routerLink="/app/dashboard" routerLinkActive="active">
                <span class="material-symbols-outlined">dashboard</span>
                <span>Dashboard</span>
              </a>
            </li>
            <li class="nav-item" *ngIf="permissionService.hasPermission('open_table')">
              <a class="nav-link" routerLink="/app/tables" routerLinkActive="active">
                <span class="material-symbols-outlined">table_restaurant</span>
                <span>Tables</span>
              </a>
            </li>
            <li class="nav-item" *ngIf="permissionService.hasPermission('create_menu')">
              <a class="nav-link" routerLink="/app/menu" routerLinkActive="active">
                <span class="material-symbols-outlined">restaurant_menu</span>
                <span>Menu</span>
              </a>
            </li>
            <li class="nav-item" *ngIf="permissionService.hasPermission('view_staff')">
              <a class="nav-link" routerLink="/app/staff" routerLinkActive="active">
                <span class="material-symbols-outlined">group</span>
                <span>Staff</span>
              </a>
            </li>
            <li class="nav-section-label">Operations</li>
            <li class="nav-item" *ngIf="permissionService.hasPermission('accept_payment')">
              <a class="nav-link" routerLink="/app/bills" routerLinkActive="active">
                <span class="material-symbols-outlined">receipt_long</span>
                <span>Bills</span>
              </a>
            </li>
            <li class="nav-item" *ngIf="permissionService.hasPermission('view_daily_sales')">
              <a class="nav-link" routerLink="/app/reports" routerLinkActive="active">
                <span class="material-symbols-outlined">bar_chart</span>
                <span>Reports</span>
              </a>
            </li>
            <li class="nav-item" *ngIf="permissionService.hasPermission('view_dashboard')">
              <a class="nav-link" routerLink="/app/analytics" routerLinkActive="active">
                <span class="material-symbols-outlined">analytics</span>
                <span>Analytics</span>
              </a>
            </li>
            <li class="nav-item" *ngIf="permissionService.hasPermission('view_staff')">
              <a class="nav-link" routerLink="/app/departments" routerLinkActive="active">
                <span class="material-symbols-outlined">category</span>
                <span>Departments</span>
              </a>
            </li>
            <li class="nav-item" *ngIf="permissionService.hasPermission('manage_suppliers')">
              <a class="nav-link" routerLink="/app/suppliers" routerLinkActive="active">
                <span class="material-symbols-outlined">local_shipping</span>
                <span>Suppliers</span>
              </a>
            </li>
            <li class="nav-item" *ngIf="permissionService.hasPermission('view_dashboard')">
              <a class="nav-link" routerLink="/app/shifts" routerLinkActive="active">
                <span class="material-symbols-outlined">schedule</span>
                <span>Shifts</span>
              </a>
            </li>
            <li class="nav-item" *ngIf="permissionService.hasPermission('view_inventory')">
              <a class="nav-link" routerLink="/app/inventory" routerLinkActive="active">
                <span class="material-symbols-outlined">inventory_2</span>
                <span>Inventory</span>
              </a>
            </li>
            <li class="nav-item" *ngIf="permissionService.hasPermission('view_inventory')">
              <a class="nav-link" routerLink="/app/inventory/audit" routerLinkActive="active">
                <span class="material-symbols-outlined">fact_check</span>
                <span>Audit</span>
              </a>
            </li>
            <li class="nav-item" *ngIf="permissionService.hasPermission('adjust_stock')">
              <a class="nav-link" routerLink="/app/inventory/reconcile" routerLinkActive="active">
                <span class="material-symbols-outlined">balance</span>
                <span>Reconcile</span>
              </a>
            </li>
            <li class="nav-item" *ngIf="permissionService.hasPermission('view_inventory')">
              <a class="nav-link" routerLink="/app/inventory/daily-tally" routerLinkActive="active">
                <span class="material-symbols-outlined">summarize</span>
                <span>Daily Tally</span>
              </a>
            </li>
            <li class="nav-item" *ngIf="permissionService.hasPermission('view_dashboard')">
              <a class="nav-link" routerLink="/app/pos" routerLinkActive="active">
                <span class="material-symbols-outlined">point_of_sale</span>
                <span>POS</span>
              </a>
            </li>
            <li class="nav-item" *ngIf="permissionService.hasPermission('manage_subscription') && profile().role !== 'super_admin'">
              <a class="nav-link" routerLink="/app/billing" routerLinkActive="active">
                <span class="material-symbols-outlined">credit_card</span>
                <span>Billing</span>
              </a>
            </li>
            <li class="nav-item" *ngIf="permissionService.hasPermission('assign_roles')">
              <a class="nav-link" routerLink="/app/roles" routerLinkActive="active">
                <span class="material-symbols-outlined">admin_panel_settings</span>
                <span>Roles</span>
              </a>
            </li>
            <li class="nav-item" *ngIf="permissionService.hasPermission('restaurant_settings') && profile().role !== 'super_admin'">
              <a class="nav-link" routerLink="/app/settings" routerLinkActive="active">
                <span class="material-symbols-outlined">settings</span>
                <span>Settings</span>
              </a>
            </li>
            <li class="nav-section-label" *ngIf="permissionService.hasPermission('approve_orders')">Supervisor</li>
            <li class="nav-item" *ngIf="permissionService.hasPermission('approve_orders')">
              <a class="nav-link" (click)="openSupervisorPage()">
                <span class="material-symbols-outlined">fact_check</span>
                <span>Orders Queue</span>
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
          <div class="search-wrapper">
            <div class="search-container">
              <span class="material-symbols-outlined">search</span>
              <input type="text" [formControl]="searchControl" placeholder="Search orders, tables, or staff..." (blur)="onSearchBlur()">
            </div>
            <div class="suggestions-dropdown" *ngIf="showDropdown()">
              <div class="suggestion-item" *ngFor="let item of searchResults()" (click)="navigateTo(item)">
                <span class="material-symbols-outlined">{{ item.type === 'table' ? 'table_restaurant' : item.type === 'staff' ? 'person' : 'receipt_long' }}</span>
                <div>
                  <span class="label">{{ item.label }}</span>
                  <span class="subtitle">{{ item.subtitle }}</span>
                </div>
              </div>
              <div class="no-results" *ngIf="searchResults().length === 0">
                No results found
              </div>
            </div>
          </div>
          <div class="top-nav-right">
            <div class="top-nav-actions">
              <button class="icon-btn" (click)="themeService.toggleTheme()" [attr.aria-label]="(themeService.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode')">
                <span class="material-symbols-outlined">{{ themeService.theme() === 'dark' ? 'light_mode' : 'dark_mode' }}</span>
              </button>
              <button class="icon-btn" (click)="openNotifications()">
                <span class="material-symbols-outlined">notifications</span>
                <span class="notif-dots" *ngIf="notifLoading()">...</span>
                <span class="notification-dot" *ngIf="!notifLoading() && hasNotifications()"></span>
              </button>
              <button class="icon-btn">
                <span class="material-symbols-outlined">help</span>
                <span class="btn-text">Help</span>
              </button>
            </div>
            <div class="divider"></div>
            <div class="user-profile">
              <div class="user-info">
                <p class="user-name">{{ profile().fullName || 'Admin' }}</p>
                <p class="user-role">{{ profile().role === 'owner' ? 'Owner' : (profile().role === 'super_admin' ? 'Super Admin' : (permissionService.hasPermission('create_staff') ? 'Manager' : (profile().role === 'supervisor' ? 'Supervisor' : (profile().role === 'chef' ? 'Chef' : 'Staff')))) }}</p>
              </div>
              <img [src]="profile().avatarUrl || 'https://ui-avatars.com/api/?name=' + (profile().fullName || 'A') + '&background=9d4300&color=fff'" alt="Profile">
            </div>
          </div>
        </header>

        <!-- Subscription Banner -->
        <div class="sub-banner" *ngIf="subForBanner() as sub">
          <div class="sub-banner-inner status-{{ sub.status }}" *ngIf="sub.status === 'trialing'">
            <span class="material-symbols-outlined">info</span>
            <span>Free trial — {{ daysLeft(sub.trialEndsAt) }} days remaining. <a routerLink="/app/billing">Choose a plan</a> to keep access.</span>
          </div>
          <div class="sub-banner-inner status-{{ sub.status }}" *ngIf="sub.status === 'past_due'">
            <span class="material-symbols-outlined">warning</span>
            <span>Payment failed — {{ daysLeft(sub.gracePeriodEndsAt) }} days before lockout. <a routerLink="/app/billing">Update payment</a>.</span>
          </div>
          <div class="sub-banner-inner status-{{ sub.status }}" *ngIf="sub.status === 'expired'">
            <span class="material-symbols-outlined">block</span>
            <span>Subscription expired. <a routerLink="/app/billing">Choose a plan</a> to restore access.</span>
          </div>
          <div class="sub-banner-inner status-{{ sub.status }}" *ngIf="sub.status === 'canceled'">
            <span class="material-symbols-outlined">cancel</span>
            <span>Canceled — expires {{ sub.currentPeriodEnd | date:'mediumDate' }}. <a routerLink="/app/billing">Reactivate</a>.</span>
          </div>
        </div>

        <!-- Impersonation Banner -->
        <div class="impersonation-banner" *ngIf="impersonating()">
          <span class="material-symbols-outlined">visibility</span>
          <span>Viewing <strong>{{ impersonating() }}</strong> dashboard</span>
          <button class="back-to-admin-btn" (click)="stopImpersonating()">
            <span class="material-symbols-outlined">arrow_back</span>
            Back to Admin
          </button>
        </div>

        <!-- Router Outlet -->
        <main class="content-area">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host {
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
      width: 280px;
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
      flex-shrink: 0;
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
      overflow-y: auto;
      min-height: 0;
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

    .nav-section-label {
      width: 100%;
      padding: 20px 24px 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--secondary);
      opacity: 0.6;
      list-style: none;
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
      flex-shrink: 0;
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

    .search-wrapper {
      position: relative;

      .suggestions-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        right: 0;
        background: var(--surface-container);
        border: 1px solid var(--outline-variant);
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        z-index: 1000;
        max-height: 320px;
        overflow-y: auto;
      }

      .suggestion-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        cursor: pointer;
        border-bottom: 1px solid var(--outline-variant);

        &:hover { background: var(--surface-container-high); }
        &:last-child { border-bottom: none; }

        .material-symbols-outlined {
          color: var(--secondary);
        }

        .label {
          font-size: 14px;
          font-weight: 500;
          color: var(--on-surface);
          display: block;
        }

        .subtitle {
          font-size: 12px;
          color: var(--on-surface-variant);
        }
      }

      .no-results {
        padding: 16px;
        text-align: center;
        font-size: 13px;
        color: var(--on-surface-variant);
      }
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
    .notif-dots {
      position: absolute;
      top: 4px;
      right: 4px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
      color: var(--primary);
      animation: dotPulse 1.4s infinite;
    }
    @keyframes dotPulse {
      0%, 80%, 100% { opacity: 0.3; }
      40% { opacity: 1; }
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
      border: 2px solid color-mix(in srgb, var(--primary) 20%, transparent);
    }

    .sub-banner { width: 100%; }
    .sub-banner-inner { display: flex; align-items: center; gap: 8px; padding: 10px 24px; font-size: 14px; font-weight: 500; }
    .sub-banner-inner a { color: inherit; font-weight: 700; text-decoration: underline; }
    .sub-banner-inner.status-trialing { background: color-mix(in srgb, var(--tertiary) 20%, var(--surface)); color: var(--on-tertiary-container); }
    .sub-banner-inner.status-past_due { background: color-mix(in srgb, var(--secondary) 20%, var(--surface)); color: var(--on-secondary-container); }
    .sub-banner-inner.status-expired { background: color-mix(in srgb, var(--error) 20%, var(--surface)); color: var(--on-error-container); }
    .sub-banner-inner.status-canceled { background: color-mix(in srgb, var(--on-surface-variant) 15%, var(--surface)); color: var(--on-surface-variant); }
    .sub-banner-inner .material-symbols-outlined { font-size: 20px; }

    .content-area {
      flex: 1;
      overflow-y: auto;
    }

    .impersonation-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 24px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: #fff;
      font-size: 14px;
      font-weight: 500;
    }
    .impersonation-banner .material-symbols-outlined { font-size: 20px; }
    .back-to-admin-btn {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 16px;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 8px;
      background: rgba(255,255,255,0.15);
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      font-family: 'Inter', sans-serif;
    }
    .back-to-admin-btn:hover {
      background: rgba(255,255,255,0.25);
    }
    .impersonate-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
    .impersonate-loader { background: var(--surface-container-lowest); border-radius: 16px; padding: 40px 48px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.18); }
    .impersonate-loader p { margin: 16px 0 0; font-size: 15px; color: var(--on-surface); }
    .spinner { width: 40px; height: 40px; margin: 0 auto; border: 3px solid var(--outline-variant); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AdminShellComponent implements OnInit, OnDestroy {
  sidebarCollapsed = signal(false);
  impersLoading = signal(false);
  profile = signal<{ fullName?: string; role?: string; avatarUrl?: string }>({ fullName: 'Admin', role: localStorage.getItem('userRole') || '' });
  hasNotifications = signal(false);
  notifLoading = signal(true);
  searchControl = new FormControl('');
  searchResults = signal<SearchResult[]>([]);
  showDropdown = signal(false);
  subForBanner = computed(() => {
    const sub = this.subService.subscription();
    if (!sub || this.profile().role === 'super_admin') return null;
    return sub;
  });

  impersonating(): string | null {
    return localStorage.getItem('impersonating');
  }

  private authService = inject(AuthService);
  private userApi = inject(UserApiService);
  private tablesApi = inject(TablesApiService);
  private tabsApi = inject(TabsApiService);
  private http = inject(HttpClient);
  private env = inject<EnvironmentConfig>(ENVIRONMENT_CONFIG);
  private router = inject(Router);
  subService = inject(SubscriptionService);
  themeService = inject(ThemeService);
  permissionService = inject(PermissionService);
  private notifSub?: Subscription;

  daysLeft(dateStr: string | null): number {
    if (!dateStr) return 0;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  ngOnInit() {
    this.permissionService.loadPermissions();
    this.subService.load();
    this.userApi.getMe().subscribe({
      next: (user: any) => {
        let apiRole = user.role;
        if (apiRole === 'superadmin') apiRole = 'super_admin';
        const role = localStorage.getItem('userRole') || apiRole || '';
        this.profile.set({ fullName: user.fullName, role, avatarUrl: user.avatarUrl || user.avatar_url });
      },
      error: () => {
        const cachedRole = localStorage.getItem('userRole');
        if (cachedRole) {
          this.profile.update(p => ({ ...p, role: cachedRole }));
        }
      }
    });

    this.pollNotifications();
    this.notifSub = interval(30000).subscribe(() => this.pollNotifications());

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.trim().length < 2) {
          this.showDropdown.set(false);
          return of([]);
        }
        const q = query.trim().toLowerCase();
        return forkJoin({
          tables: this.tablesApi.getAllTables(),
          tabs: this.tabsApi.getAllTabsUnpaginated(),
          staff: this.userApi.listWaiters(),
        }).pipe(
          map(({ tables, tabs, staff }) => {
            const results: SearchResult[] = [];
            tables.forEach(t => {
              if ((t.label || '').toLowerCase().includes(q) || (t.tableNumber || '').toLowerCase().includes(q) || (t.status || '').toLowerCase().includes(q)) {
                results.push({ type: 'table', label: t.label || `Table ${t.tableNumber}`, subtitle: t.status, route: '/app/tables' });
              }
            });
            staff.forEach(s => {
              if ((s.fullName || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q)) {
                results.push({ type: 'staff', label: s.fullName || s.email, subtitle: s.role || 'Staff', route: '/app/staff' });
              }
            });
            (tabs || []).forEach(t => {
              if ((t.id || '').toLowerCase().includes(q) || (t.status || '').toLowerCase().includes(q)) {
                results.push({ type: 'order', label: `Tab #${(t.id || '').slice(0, 8)}`, subtitle: t.status, route: '/app/tables' });
              }
            });
            return results.slice(0, 10);
          })
        );
      })
    ).subscribe(results => {
      this.searchResults.set(results);
      this.showDropdown.set(results.length > 0);
    });
  }

  navigateTo(item: SearchResult) {
    this.showDropdown.set(false);
    this.searchControl.setValue('');
    this.router.navigate([item.route]);
  }

  onSearchBlur() {
    setTimeout(() => this.showDropdown.set(false), 200);
  }

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }

  logout() {
    Swal.fire({
      title: 'Logout?',
      text: 'You will be redirected to the login screen.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#F97316',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (result.isConfirmed) {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }

  openNotifications() {
    this.router.navigate(['/app/notifications']);
  }

  openSupervisorPage() {
    const waiterUrl = (this.env as any).waiterBaseUrl || 'http://localhost:4201';
    window.open(`${waiterUrl}/supervisor/orders`, '_blank');
  }

  stopImpersonating() {
    this.impersLoading.set(true);
    this.authService.stopImpersonating();
    window.location.href = '/app/admin/dashboard';
  }

  private pollNotifications() {
    this.http.get<any>(`${this.env.apiUrl}/api/v1/notifications`).subscribe({
      next: (res) => {
        const data = res?.data || res || [];
        this.hasNotifications.set(Array.isArray(data) && data.some((n: any) => !n.is_read));
        this.notifLoading.set(false);
      },
      error: () => this.notifLoading.set(false),
    });
  }

  ngOnDestroy() {
    this.notifSub?.unsubscribe();
  }
}
