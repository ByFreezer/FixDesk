import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataTableComponent } from './data-table.component';

describe('DataTableComponent', () => {
  let component: DataTableComponent;
  let fixture: ComponentFixture<DataTableComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DataTableComponent);
    component = fixture.componentInstance;
    component.data = [
      { titulo: 'Fallo impresora', estado: 'Abierta' },
      { titulo: 'Router caído', estado: 'Cerrada' },
    ];
    component.columns = [{ key: 'titulo', label: 'Título' }];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filtra las filas según el texto del buscador', () => {
    component.search = 'router';
    expect(component.filteredData.length).toBe(1);
    expect(component.filteredData[0]['titulo']).toBe('Router caído');
  });

  it('sin texto muestra todas las filas', () => {
    expect(component.filteredData.length).toBe(2);
  });

  it('emite rowSelected al seleccionar una fila', () => {
    let emitida: unknown = null;
    component.rowSelected.subscribe((r) => (emitida = r));
    component.rowSelected.emit(component.data[0]);
    expect(emitida).toEqual(component.data[0]);
  });
});
