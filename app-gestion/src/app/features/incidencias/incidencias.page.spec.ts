import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';

import { IncidenciasPage } from './incidencias.page';

describe('IncidenciasPage', () => {
  let component: IncidenciasPage;
  let fixture: ComponentFixture<IncidenciasPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidenciasPage],
      providers: [provideRouter([]), provideIonicAngular()],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidenciasPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
