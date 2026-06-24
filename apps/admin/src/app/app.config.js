import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';
import { ENVIRONMENT_CONFIG } from "../../../../libs/shared/data-access/src/index.ts";
export const appConfig = {
    providers: [
        provideRouter(appRoutes),
        provideHttpClient(withInterceptors([authInterceptor])),
        {
            provide: ENVIRONMENT_CONFIG,
            useValue: environment,
        },
    ],
};
//# sourceMappingURL=app.config.js.map