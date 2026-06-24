import { provideBrowserGlobalErrorListeners, } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS, } from '@angular/common/http';
import { AuthInterceptor } from "../../../../libs/shared/data-access/src/index.ts";
import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';
import { ENVIRONMENT_CONFIG } from "../../../../libs/shared/data-access/src/index.ts";
export const appConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideRouter(appRoutes, withRouterConfig({ onSameUrlNavigation: 'reload' })),
        provideAnimations(),
        provideHttpClient(withInterceptorsFromDi()),
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true,
        },
        {
            provide: ENVIRONMENT_CONFIG,
            useValue: environment,
        },
    ],
};
//# sourceMappingURL=app.config.js.map