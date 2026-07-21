import { Route } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SupervisorOrdersComponent } from './supervisor/supervisor-orders.component';
import { ChefComponent } from './chef/chef.component';
import { ActivityHistoryComponent } from './activity/activity-history.component';
import { TablesComponent } from './tables/tables.component';
import { TabDetailComponent } from './tabs/tab-detail/tab-detail.component';
import { MenuComponent } from './menu/menu.component';
import { BillComponent } from './tabs/bill/bill.component';
import { PaymentComponent } from './tabs/payment/payment.component';
import { ReceiptComponent } from './tabs/receipt/receipt.component';
import { TabHistoryComponent } from './tabs/tab-history/tab-history.component';
import { ProfileComponent } from './profile/profile.component';
import { OpenTabComponent } from './tables/open-tab/open-tab.component';
import { WaiterNotificationsComponent } from './notifications/notifications.component';

import { LegacyTablesComponent } from './legacy/tables/tables.component';
import { LegacyTabDetailComponent } from './legacy/tab-detail/tab-detail.component';
import { LegacyMenuComponent } from './legacy/menu/menu.component';
import { LegacyBillComponent } from './legacy/bill/bill.component';
import { LegacyPaymentComponent } from './legacy/payment/payment.component';
import { LegacyReceiptComponent } from './legacy/receipt/receipt.component';
import { LegacyTabHistoryComponent } from './legacy/tab-history/tab-history.component';
import { LegacyProfileComponent } from './legacy/profile/profile.component';
import { LegacyOpenTabComponent } from './legacy/open-tab/open-tab.component';

import { authGuard } from './core/auth.guard';
import { prefersCurrentTheme, prefersLegacyTheme } from './core/theme.guards';

export const appRoutes: Route[] = [
  { path: 'login', component: LoginComponent },

  // ===== Current theme (Luminous Edition) =====
  { path: 'tables', canActivate: [authGuard], canMatch: [prefersCurrentTheme], component: TablesComponent },
  { path: 'tabs/detail/:id', canActivate: [authGuard], canMatch: [prefersCurrentTheme], component: TabDetailComponent },
  { path: 'tabs/bill/:id', canActivate: [authGuard], canMatch: [prefersCurrentTheme], component: BillComponent },
  { path: 'tabs/payment/:id', canActivate: [authGuard], canMatch: [prefersCurrentTheme], component: PaymentComponent },
  { path: 'tabs/receipt/:id', canActivate: [authGuard], canMatch: [prefersCurrentTheme], component: ReceiptComponent },
  { path: 'tabs/history', canActivate: [authGuard], canMatch: [prefersCurrentTheme], component: TabHistoryComponent },
  { path: 'menu', canActivate: [authGuard], canMatch: [prefersCurrentTheme], component: MenuComponent },
  { path: 'tabs/create/:tableId', canActivate: [authGuard], canMatch: [prefersCurrentTheme], component: OpenTabComponent },
  { path: 'profile', canActivate: [authGuard], canMatch: [prefersCurrentTheme], component: ProfileComponent },

  // ===== Legacy theme (pre-Luminous) =====
  { path: 'tables', canActivate: [authGuard], canMatch: [prefersLegacyTheme], component: LegacyTablesComponent },
  { path: 'tabs/detail/:id', canActivate: [authGuard], canMatch: [prefersLegacyTheme], component: LegacyTabDetailComponent },
  { path: 'tabs/bill/:id', canActivate: [authGuard], canMatch: [prefersLegacyTheme], component: LegacyBillComponent },
  { path: 'tabs/payment/:id', canActivate: [authGuard], canMatch: [prefersLegacyTheme], component: LegacyPaymentComponent },
  { path: 'tabs/receipt/:id', canActivate: [authGuard], canMatch: [prefersLegacyTheme], component: LegacyReceiptComponent },
  { path: 'tabs/history', canActivate: [authGuard], canMatch: [prefersLegacyTheme], component: LegacyTabHistoryComponent },
  { path: 'menu', canActivate: [authGuard], canMatch: [prefersLegacyTheme], component: LegacyMenuComponent },
  { path: 'tabs/create/:tableId', canActivate: [authGuard], canMatch: [prefersLegacyTheme], component: LegacyOpenTabComponent },
  { path: 'profile', canActivate: [authGuard], canMatch: [prefersLegacyTheme], component: LegacyProfileComponent },

  // ===== Supervisor (no theme guards) =====
  { path: 'supervisor/orders', canActivate: [authGuard], component: SupervisorOrdersComponent },

  // ===== Chef Kitchen Display =====
  { path: 'chef', canActivate: [authGuard], component: ChefComponent },

  // ===== Activity History =====
  { path: 'activity', canActivate: [authGuard], component: ActivityHistoryComponent },

  // ===== Notifications =====
  { path: 'notifications', canActivate: [authGuard], component: WaiterNotificationsComponent },

  { path: '', redirectTo: 'tables', pathMatch: 'full' }
];
