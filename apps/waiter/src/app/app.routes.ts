import { Route } from '@angular/router';

import { authGuard } from './core/auth.guard';
import { waiterGuard } from './core/role.guards';
import { prefersCurrentTheme, prefersLegacyTheme } from './core/theme.guards';

/*
 * Every component here is loaded on demand. These screens used to be eagerly
 * imported, which put ~560 kB of waiter app code plus Angular's forms and
 * animations packages into the initial bundle for every user, even though a
 * waiter only ever visits a couple of screens per session. Guards stay statically
 * imported because they must run before a lazy route resolves.
 */
export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
  },

  // ===== Current theme (Luminous Edition) =====
  {
    path: 'tables',
    canActivate: [authGuard, waiterGuard],
    canMatch: [prefersCurrentTheme],
    loadComponent: () => import('./tables/tables.component').then((m) => m.TablesComponent),
  },
  {
    path: 'tabs/detail/:id',
    canActivate: [authGuard, waiterGuard],
    canMatch: [prefersCurrentTheme],
    loadComponent: () => import('./tabs/tab-detail/tab-detail.component').then((m) => m.TabDetailComponent),
  },
  {
    path: 'tabs/bill/:id',
    canActivate: [authGuard, waiterGuard],
    canMatch: [prefersCurrentTheme],
    loadComponent: () => import('./tabs/bill/bill.component').then((m) => m.BillComponent),
  },
  {
    path: 'tabs/payment/:id',
    canActivate: [authGuard, waiterGuard],
    canMatch: [prefersCurrentTheme],
    loadComponent: () => import('./tabs/payment/payment.component').then((m) => m.PaymentComponent),
  },
  {
    path: 'tabs/payment-success/:id',
    canActivate: [authGuard, waiterGuard],
    canMatch: [prefersCurrentTheme],
    loadComponent: () =>
      import('./tabs/payment-success/payment-success.component').then((m) => m.PaymentSuccessComponent),
  },
  {
    path: 'tabs/receipt/:id',
    canActivate: [authGuard, waiterGuard],
    canMatch: [prefersCurrentTheme],
    loadComponent: () => import('./tabs/receipt/receipt.component').then((m) => m.ReceiptComponent),
  },
  {
    path: 'tabs/history',
    canActivate: [authGuard, waiterGuard],
    canMatch: [prefersCurrentTheme],
    loadComponent: () =>
      import('./tabs/tab-history/tab-history.component').then((m) => m.TabHistoryComponent),
  },
  {
    path: 'menu',
    canActivate: [authGuard, waiterGuard],
    canMatch: [prefersCurrentTheme],
    loadComponent: () => import('./menu/menu.component').then((m) => m.MenuComponent),
  },
  {
    path: 'tabs/create/:tableId',
    canActivate: [authGuard, waiterGuard],
    canMatch: [prefersCurrentTheme],
    loadComponent: () => import('./tables/open-tab/open-tab.component').then((m) => m.OpenTabComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard, waiterGuard],
    canMatch: [prefersCurrentTheme],
    loadComponent: () => import('./profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'waiter-calls',
    canActivate: [authGuard, waiterGuard],
    loadComponent: () =>
      import('./waiter-calls/waiter-calls.component').then((m) => m.WaiterCallsComponent),
  },

  // ===== Legacy theme (pre-Luminous) =====
  {
    path: 'tables',
    canActivate: [authGuard, waiterGuard],
    canMatch: [prefersLegacyTheme],
    loadComponent: () =>
      import('./legacy/tables/tables.component').then((m) => m.LegacyTablesComponent),
  },
  {
    path: 'tabs/detail/:id',
    canActivate: [authGuard, waiterGuard],
    canMatch: [prefersLegacyTheme],
    loadComponent: () =>
      import('./legacy/tab-detail/tab-detail.component').then((m) => m.LegacyTabDetailComponent),
  },
  {
    path: 'tabs/bill/:id',
    canActivate: [authGuard, waiterGuard],
    canMatch: [prefersLegacyTheme],
    loadComponent: () =>
      import('./legacy/bill/bill.component').then((m) => m.LegacyBillComponent),
  },
  {
    path: 'tabs/payment/:id',
    canActivate: [authGuard, waiterGuard],
    canMatch: [prefersLegacyTheme],
    loadComponent: () =>
      import('./legacy/payment/payment.component').then((m) => m.LegacyPaymentComponent),
  },
  {
    path: 'tabs/payment-success/:id',
    canActivate: [authGuard, waiterGuard],
    canMatch: [prefersLegacyTheme],
    loadComponent: () =>
      import('./tabs/payment-success/payment-success.component').then((m) => m.PaymentSuccessComponent),
  },
  {
    path: 'tabs/receipt/:id',
    canActivate: [authGuard, waiterGuard],
    canMatch: [prefersLegacyTheme],
    loadComponent: () =>
      import('./legacy/receipt/receipt.component').then((m) => m.LegacyReceiptComponent),
  },
  {
    path: 'tabs/history',
    canActivate: [authGuard, waiterGuard],
    canMatch: [prefersLegacyTheme],
    loadComponent: () =>
      import('./legacy/tab-history/tab-history.component').then((m) => m.LegacyTabHistoryComponent),
  },
  {
    path: 'menu',
    canActivate: [authGuard, waiterGuard],
    canMatch: [prefersLegacyTheme],
    loadComponent: () => import('./legacy/menu/menu.component').then((m) => m.LegacyMenuComponent),
  },
  {
    path: 'tabs/create/:tableId',
    canActivate: [authGuard, waiterGuard],
    canMatch: [prefersLegacyTheme],
    loadComponent: () =>
      import('./legacy/open-tab/open-tab.component').then((m) => m.LegacyOpenTabComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard, waiterGuard],
    canMatch: [prefersLegacyTheme],
    loadComponent: () =>
      import('./legacy/profile/profile.component').then((m) => m.LegacyProfileComponent),
  },

  // ===== Supervisor (no theme guards) =====
  {
    path: 'supervisor/orders',
    canActivate: [authGuard, waiterGuard],
    loadComponent: () =>
      import('./supervisor/supervisor-orders.component').then((m) => m.SupervisorOrdersComponent),
  },

  // ===== Chef Kitchen Display =====
  {
    path: 'chef',
    canActivate: [authGuard, waiterGuard],
    loadComponent: () => import('./chef/chef.component').then((m) => m.ChefComponent),
  },

  // ===== Activity History =====
  {
    path: 'activity',
    canActivate: [authGuard, waiterGuard],
    loadComponent: () =>
      import('./activity/activity-history.component').then((m) => m.ActivityHistoryComponent),
  },

  // ===== Notifications =====
  {
    path: 'notifications',
    canActivate: [authGuard, waiterGuard],
    loadComponent: () =>
      import('./notifications/notifications.component').then((m) => m.WaiterNotificationsComponent),
  },

  { path: '', redirectTo: 'tables', pathMatch: 'full' },
];