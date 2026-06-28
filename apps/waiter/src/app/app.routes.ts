import { Route } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { TablesComponent } from './tables/tables.component';
import { TabDetailComponent } from './tabs/tab-detail/tab-detail.component';
import { MenuComponent } from './menu/menu.component';
import { BillComponent } from './tabs/bill/bill.component';
import { PaymentComponent } from './tabs/payment/payment.component';
import { ReceiptComponent } from './tabs/receipt/receipt.component';
import { TabHistoryComponent } from './tabs/tab-history/tab-history.component';
import { ProfileComponent } from './profile/profile.component';
import { OpenTabComponent } from './tables/open-tab/open-tab.component';

import { authGuard } from './core/auth.guard';

export const appRoutes: Route[] = [
  { path: 'login', component: LoginComponent },
  { path: 'tables', component: TablesComponent, canActivate: [authGuard] },
  { path: 'tabs/detail/:id', component: TabDetailComponent, canActivate: [authGuard] },
  { path: 'tabs/bill/:id', component: BillComponent, canActivate: [authGuard] },
  { path: 'tabs/payment/:id', component: PaymentComponent, canActivate: [authGuard] },
  { path: 'tabs/receipt/:id', component: ReceiptComponent, canActivate: [authGuard] },
  { path: 'tabs/history', component: TabHistoryComponent, canActivate: [authGuard] },
  { path: 'menu', component: MenuComponent, canActivate: [authGuard] },
  { path: 'tabs/create/:tableId', component: OpenTabComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
