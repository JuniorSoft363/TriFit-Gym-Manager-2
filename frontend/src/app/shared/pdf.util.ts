import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportarPdf(titulo: string, encabezados: string[], filas: (string | number)[][]) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(titulo, 14, 15);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleString('es-EC'), 14, 21);

  autoTable(doc, {
    startY: 26,
    head: [encabezados],
    body: filas,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [26, 115, 128] }
  });

  doc.save(`${titulo.replace(/\s+/g, '_').toLowerCase()}.pdf`);
}
