import { Route } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () => import('./orders/orders.component').then(m => m.OrdersComponent)
  },
  { path: '', redirectTo: 'orders', pathMatch: 'full' }
];
