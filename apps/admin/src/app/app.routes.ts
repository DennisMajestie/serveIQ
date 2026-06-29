import { Route } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./shell/admin-shell.component').then(m => m.AdminShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./analytics/analytics.component').then(m => m.AnalyticsComponent)
      },
      {
        path: 'tables',
        children: [
          {
            path: '',
            loadComponent: () => import('./tables/tables-management.component').then(m => m.TablesManagementComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./tables/table-detail.component').then(m => m.TableDetailComponent)
          }
        ]
      },
      {
        path: 'menu',
        loadComponent: () => import('./menu/menu-management.component').then(m => m.MenuManagementComponent)
      },
      {
        path: 'staff',
        loadComponent: () => import('./staff/waiter-management.component').then(m => m.WaiterManagementComponent)
      },
      {
        path: 'bills',
        loadComponent: () => import('./bills/bills.component').then(m => m.BillsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register-business.component').then(m => m.RegisterBusinessComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  }
];
