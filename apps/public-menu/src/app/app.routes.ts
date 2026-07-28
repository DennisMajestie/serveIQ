import { Route } from '@angular/router';
import { MenuPageComponent } from './menu-page/menu-page.component';
import { CartPageComponent } from './cart-page/cart-page.component';
import { StatusPageComponent } from './status-page/status-page.component';

export const appRoutes: Route[] = [
  { path: 'public/menu/:branchId', component: MenuPageComponent },
  { path: 'public/menu/:branchId/cart', component: CartPageComponent },
  { path: 'public/track/:code', component: StatusPageComponent },
  { path: 'public/status', component: StatusPageComponent },
  { path: '', redirectTo: '/public/menu/default', pathMatch: 'full' },
  { path: '**', redirectTo: '/public/menu/default' },
];