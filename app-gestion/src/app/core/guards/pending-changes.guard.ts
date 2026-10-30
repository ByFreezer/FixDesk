import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { AlertController } from '@ionic/angular';

/** Lo implementan las páginas con formularios que no se deben abandonar sin avisar */
export interface ConCambiosPendientes {
  tieneCambiosSinGuardar(): boolean;
}

/**
 * canDeactivate: si el formulario tiene cambios sin guardar, pide confirmación antes de salir.
 */
export const pendingChangesGuard: CanDeactivateFn<ConCambiosPendientes> = async (component) => {
  if (!component.tieneCambiosSinGuardar()) {
    return true;
  }

  const alert = await inject(AlertController).create({
    header: 'Cambios sin guardar',
    message: 'Si sales ahora se perderán los datos de la incidencia. ¿Quieres salir?',
    buttons: [
      { text: 'Seguir editando', role: 'cancel' },
      { text: 'Salir', role: 'confirm' },
    ],
  });
  await alert.present();
  const { role } = await alert.onDidDismiss();
  return role === 'confirm';
};
