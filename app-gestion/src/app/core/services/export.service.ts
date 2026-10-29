import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({ providedIn: 'root' })
export class ExportService {
  /**
   * Exportación de datos en formato CSV con soporte UTF-8 (BOM) para caracteres especiales
   */
  toCsv(data: any[], filename = 'informe_incidencias.csv') {
    if (!data || !data.length) return;

    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
      headers
        .map(h => {
          const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    this.download(blob, filename);
  }

  /**
   * Exportación de datos en formato PDF con diseño tabulado profesional (RA 5)
   */
  toPdf(data: any[], filename = 'informe_incidencias.pdf') {
    if (!data || !data.length) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Encabezado corporativo
    doc.setFillColor(33, 53, 71); // Azul oscuro corporativo
    doc.rect(0, 0, 297, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('SISTEMA DE GESTIÓN MULTIPLATAFORMA - INFORME OFICIAL', 14, 15);

    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${new Date().toLocaleString()}`, 210, 15);

    // Mapeo de columnas y datos
    const columns = [
      { header: 'CÓDIGO', dataKey: 'codigo' },
      { header: 'TÍTULO', dataKey: 'titulo' },
      { header: 'CATEGORÍA', dataKey: 'categoria' },
      { header: 'PRIORIDAD', dataKey: 'prioridad' },
      { header: 'ESTADO', dataKey: 'estado' },
      { header: 'FECHA', dataKey: 'fecha' },
      { header: 'RESPONSABLE', dataKey: 'usuario' },
    ];

    const body = data.map(item => ({
      codigo: item.codigo || item.id || '-',
      titulo: item.titulo || '-',
      categoria: item.categoria || '-',
      prioridad: item.prioridad || '-',
      estado: item.estado || '-',
      fecha: item.fecha || '-',
      usuario: item.usuario || '-',
    }));

    autoTable(doc, {
      startY: 32,
      columns: columns,
      body: body,
      theme: 'striped',
      headStyles: {
        fillColor: [56, 128, 255],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: 40,
      },
      alternateRowStyles: {
        fillColor: [245, 248, 255],
      },
      margin: { left: 14, right: 14 },
    });

    doc.save(filename);
  }

  private download(blob: Blob, name: string) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }
}
