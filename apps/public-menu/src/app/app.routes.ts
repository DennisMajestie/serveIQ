import { Route } from '@angular/router';
import { PublicMenuPageComponent } from './public-menu-page/public-menu-page.component';

export const appRoutes: Route[] = [
  { path: 'public/menu/:branchId', component: PublicMenuPageComponent },
  { path: '', redirectTo: '/public/menu/default', pathMatch: 'full' },
  { path: '**', redirectTo: '/public/menu/default' },
];
