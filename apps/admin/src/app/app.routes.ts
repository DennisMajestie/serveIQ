import { Route } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { superAdminGuard } from './core/super-admin.guard';
import { permissionGuard } from './core/permission.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'app',
    loadComponent: () => import('./shell/admin-shell.component').then(m => m.AdminShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'admin/dashboard',
        loadComponent: () => import('./admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        canActivate: [superAdminGuard]
      },
      {
        path: 'admin/businesses',
        loadComponent: () => import('./admin/businesses/businesses.component').then(m => m.BusinessesComponent),
        canActivate: [superAdminGuard]
      },
      {
        path: 'admin/payment-providers',
        loadComponent: () => import('./admin/payment-providers/payment-providers.component').then(m => m.PaymentProvidersComponent),
        canActivate: [superAdminGuard]
      },
      {
        path: 'admin/plans',
        loadComponent: () => import('./admin/plans/plans.component').then(m => m.PlansComponent),
        canActivate: [superAdminGuard]
      },
      {
        path: 'admin/system-health',
        loadComponent: () => import('./admin/system-health/system-health.component').then(m => m.SystemHealthComponent),
        canActivate: [superAdminGuard]
      },
      {
        path: 'admin/audit-logs',
        loadComponent: () => import('./admin/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent),
        canActivate: [superAdminGuard]
      },
      {
        path: 'admin/revenue',
        loadComponent: () => import('./admin/revenue/revenue-analytics.component').then(m => m.RevenueAnalyticsComponent),
        canActivate: [superAdminGuard]
      },
      {
        path: 'autopilot',
        loadComponent: () => import('./autopilot/autopilot.component').then(m => m.AutopilotComponent),
        canActivate: [superAdminGuard]
      },
      {
        path: '',
        children: [
          {
            path: 'dashboard',
            canActivate: [permissionGuard('view_dashboard')],
            loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
          },
          {
            path: 'analytics',
            canActivate: [permissionGuard('view_dashboard')],
            loadComponent: () => import('./analytics/analytics.component').then(m => m.AnalyticsComponent)
          },
          {
            path: 'tables',
            children: [
              {
                path: '',
                canActivate: [permissionGuard('open_table')],
                loadComponent: () => import('./tables/tables-management.component').then(m => m.TablesManagementComponent)
              },
              {
                path: ':id',
                canActivate: [permissionGuard('open_table')],
                loadComponent: () => import('./tables/table-detail.component').then(m => m.TableDetailComponent)
              }
            ]
          },
          {
            path: 'menu',
            canActivate: [permissionGuard('create_menu')],
            loadComponent: () => import('./menu/menu-management.component').then(m => m.MenuManagementComponent)
          },
          {
            path: 'staff',
            canActivate: [permissionGuard('view_staff')],
            loadComponent: () => import('./staff/waiter-management.component').then(m => m.WaiterManagementComponent)
          },
          {
            path: 'tabs',
            children: [
              {
                path: '',
                canActivate: [permissionGuard('open_table')],
                loadComponent: () => import('./tabs/tabs-management.component').then(m => m.TabsManagementComponent)
              },
              {
                path: 'detail/:id',
                canActivate: [permissionGuard('open_table')],
                loadComponent: () => import('./tabs/tab-detail.component').then(m => m.TabDetailComponent)
              }
            ]
          },
          {
            path: 'departments',
            canActivate: [permissionGuard('view_staff')],
            loadComponent: () => import('./departments/departments.component').then(m => m.DepartmentsComponent)
          },
          {
            path: 'suppliers',
            canActivate: [permissionGuard('manage_suppliers')],
            loadComponent: () => import('./suppliers/suppliers.component').then(m => m.SuppliersComponent)
          },
          {
            path: 'shifts',
            canActivate: [permissionGuard('view_dashboard')],
            loadComponent: () => import('./shifts/shifts.component').then(m => m.ShiftsComponent)
          },
          {
            path: 'inventory',
            canActivate: [permissionGuard('view_inventory')],
            loadComponent: () => import('./inventory/inventory.component').then(m => m.InventoryComponent)
          },
          {
            path: 'inventory/audit',
            canActivate: [permissionGuard('view_inventory')],
            loadComponent: () => import('./inventory/audit/audit.component').then(m => m.AuditComponent)
          },
          {
            path: 'inventory/reconcile',
            canActivate: [permissionGuard('adjust_stock')],
            loadComponent: () => import('./inventory/reconcile/reconcile.component').then(m => m.ReconcileComponent)
          },
          {
            path: 'inventory/daily-tally',
            canActivate: [permissionGuard('view_inventory')],
            loadComponent: () => import('./inventory/daily-tally/daily-tally.component').then(m => m.DailyTallyComponent)
          },
          {
            path: 'bills',
            canActivate: [permissionGuard('accept_payment')],
            loadComponent: () => import('./bills/bills.component').then(m => m.BillsComponent)
          },
          {
            path: 'pos',
            canActivate: [permissionGuard('view_dashboard')],
            loadComponent: () => import('./features/pos/pos-management.component').then(m => m.PosManagementComponent)
          },
          {
            path: 'reports',
            canActivate: [permissionGuard('view_daily_sales')],
            loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent)
          },
          {
            path: 'notifications',
            canActivate: [permissionGuard('view_dashboard')],
            loadComponent: () => import('./notifications/notifications.component').then(m => m.NotificationsComponent)
          },
          {
            path: 'billing',
            loadComponent: () => import('./billing/billing.component').then(m => m.BillingComponent)
          },
          {
            path: 'settings',
            canActivate: [permissionGuard('restaurant_settings')],
            loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent)
          },
          {
            path: 'roles',
            canActivate: [permissionGuard('assign_roles')],
            loadComponent: () => import('./roles/roles.component').then(m => m.RolesComponent)
          },
          {
            path: 'pulse',
            canActivate: [permissionGuard('view_dashboard')],
            loadComponent: () => import('./pulse/pulse.component').then(m => m.PulseComponent)
          },
          {
            path: 'premium-dashboard',
            canActivate: [permissionGuard('view_dashboard')],
            loadComponent: () => import('./premium-dashboard/premium-dashboard.component').then(m => m.PremiumDashboardComponent)
          },
          {
            path: 'setup',
            canActivate: [permissionGuard('restaurant_settings')],
            loadComponent: () => import('./business-setup/business-setup.component').then(m => m.BusinessSetupComponent)
          },
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          }
        ]
      },
      {
        path: 'feedback',
        loadComponent: () => import('./core/feedback/feedback.component').then(m => m.FeedbackComponent)
      },
      {
        path: 'ads',
        canActivate: [superAdminGuard],
        loadComponent: () => import('./ads/ads.component').then(m => m.AdsComponent)
      }
    ]
  },
  {
    path: 'setup',
    loadComponent: () => import('./business-setup/business-setup.component').then(m => m.BusinessSetupComponent)
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
  },
  {
    path: 'public/menu/:branchId',
    loadComponent: () => import('./public-menu/public-menu.component').then(m => m.PublicMenuComponent)
  },
  {
    path: 'tracking/:code',
    loadComponent: () => import('./tracking/tracking.component').then(m => m.TrackingComponent)
  },
  {
    path: 'payment-success',
    loadComponent: () => import('./payment-success/payment-success.component').then(m => m.PaymentSuccessComponent)
  }
];