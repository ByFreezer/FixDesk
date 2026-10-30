import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthStore } from '../../core/state/auth.store';
import { Permiso } from '../../core/models/user.model';

/**
 * Directiva estructural: solo pinta el elemento si el rol del usuario tiene el permiso.
 * Es reactiva (usa signals): si cambia la sesión, el elemento aparece o desaparece solo.
 * El elemento no se oculta con CSS, directamente no existe en el DOM.
 *
 * @example
 * <ion-button *appHasPermiso="'incidencias:exportar'">Exportar CSV</ion-button>
 */
@Directive({
  selector: '[appHasPermiso]',
  standalone: true,
})
export class HasPermisoDirective {
  private tpl = inject(TemplateRef<unknown>);
  private vcr = inject(ViewContainerRef);
  private store = inject(AuthStore);

  /** Permiso requerido (o lista: basta con tener uno) */
  readonly appHasPermiso = input.required<Permiso | Permiso[]>();

  private visible = false;

  constructor() {
    effect(() => {
      const requeridos = ([] as Permiso[]).concat(this.appHasPermiso());
      const permitido = requeridos.some((p) => this.store.permisos().includes(p));
      if (permitido && !this.visible) {
        this.vcr.createEmbeddedView(this.tpl);
        this.visible = true;
      } else if (!permitido && this.visible) {
        this.vcr.clear();
        this.visible = false;
      }
    });
  }
}
