import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

/**
 * Precarga en segundo plano todas las rutas perezosas EXCEPTO las protegidas con canMatch.
 * PreloadAllModules descargaría también esas páginas (p. ej. el dashboard) aunque el rol
 * no tenga acceso; así solo se descargan cuando canMatch las autoriza.
 */
@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    return route.canMatch?.length ? of(null) : load();
  }
}
