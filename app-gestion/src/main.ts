import { inject, provideAppInitializer } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding, withPreloading } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { apiInterceptor } from './app/core/interceptors/api.interceptor';
import { errorInterceptor } from './app/core/interceptors/error.interceptor';
import { AuthService } from './app/core/services/auth.service';
import { SelectivePreloadingStrategy } from './app/core/routing/selective-preloading.strategy';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(SelectivePreloadingStrategy), withComponentInputBinding()),
    provideCharts(withDefaultRegisterables()),
    // HttpClient con interceptores, en orden: cabeceras (Bearer) → errores 401/403
    provideHttpClient(withInterceptors([apiInterceptor, errorInterceptor])),
    // Antes de arrancar, recupera la sesión guardada y valida su token
    provideAppInitializer(() => inject(AuthService).restoreSession()),
  ],
});
