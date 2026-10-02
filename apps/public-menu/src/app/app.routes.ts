import { Route } from '@angular/router';

// The menu page is the landing route for every customer and stays eagerly loaded
// so first paint needs no extra round trip. The other screens are secondary, so
// they load on demand: eager-importing them pulled ~146 kB of component code plus
// SweetAlert2 (via reservation-booking) and the whole socket.io stack (via
// status-page) into the initial bundle for every visitor.
import { MenuPageComponent } from './menu-page/menu-page.component';

export const appRoutes: Route[] = [
  { path: 'public/menu/:branchId', component: MenuPageComponent },
  {
    path: 'public/menu/:branchId/cart',
    loadComponent: () => import('./cart-page/cart-page.component').then((m) => m.CartPageComponent),
  },
  {
    path: 'public/menu/:branchId/reserve',
    loadComponent: () =>
      import('./reservation-booking/reservation-booking.component').then(
        (m) => m.ReservationBookingComponent,
      ),
  },
  {
    path: 'public/track/:code',
    loadComponent: () => import('./status-page/status-page.component').then((m) => m.StatusPageComponent),
  },
  {
    path: 'public/status',
    loadComponent: () => import('./status-page/status-page.component').then((m) => m.StatusPageComponent),
  },
  { path: '', redirectTo: '/public/menu/default', pathMatch: 'full' },
  { path: '**', redirectTo: '/public/menu/default' },
];