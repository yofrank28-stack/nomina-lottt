// ============================================================
// GENERADOR DE PDF - Recibos de Liquidación
// Biblioteca: jspdf + jspdf-autotable
// ============================================================

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReciboLiquidacionData {
  empresa: {
    nombre: string;
    rif: string;
    direccion: string;
  };
  empleado: {
    nombre: string;
    apellido: string;
    cedula: string;
    cargo: string;
    departamento: string;
    fecha_ingreso: string;
  };
  periodo: {
    ano: number;
    mes: number;
    quincena: number;
    dias_trabajados: number;
  };
  asignaciones: {
    descripcion: string;
    monto: number;
  }[];
  deducciones: {
    descripcion: string;
    monto: number;
  }[];
  totales: {
    total_asignaciones: number;
    total_deducciones: number;
    neto_pagar: number;
    tasa_cambio: number;
    neto_bs: number;
  };
  fecha_liquidacion: string;
}

type Color = [number, number, number];

/**
 * Genera el PDF del Recibo de Liquidación
 */
export function generarReciboLiquidacion(data: ReciboLiquidacionData): jsPDF {
  const doc = new jsPDF();
  
  const colorPrimario: Color = [41, 128, 185];
  const colorSecundario: Color = [52, 73, 94];
  
  doc.setFillColor(...colorPrimario);
  doc.rect(0, 0, 220, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('RECIBO DE LIQUIDACIÓN', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Período: Quincena ${data.periodo.quincena} - ${data.periodo.mes}/${data.periodo.ano}`, 105, 30, { align: 'center' });
  
  doc.setTextColor(...colorSecundario);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(data.empresa.nombre, 14, 50);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`RIF: ${data.empresa.rif}`, 14, 56);
  doc.text(`Dirección: ${data.empresa.direccion}`, 14, 61);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL TRABAJADOR', 14, 75);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Cédula: ${data.empleado.cedula}`, 14, 82);
  doc.text(`Nombre: ${data.empleado.nombre} ${data.empleado.apellido}`, 14, 88);
  doc.text(`Cargo: ${data.empleado.cargo}`, 14, 94);
  doc.text(`Departamento: ${data.empleado.departamento}`, 14, 100);
  doc.text(`Fecha Ingreso: ${data.empleado.fecha_ingreso}`, 14, 106);
  doc.text(`Días Trabajados: ${data.periodo.dias_trabajados}`, 14, 112);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ASIGNACIONES', 14, 128);
  
  autoTable(doc, {
    startY: 133,
    head: [['Descripción', 'Monto USD']],
    body: data.asignaciones.map(item => [item.descripcion, `$${item.monto.toFixed(2)}`]),
    theme: 'striped',
    headStyles: { fillColor: colorPrimario },
    columnStyles: {
      1: { halign: 'right' as const }
    }
  });
  
  const yAfterAssignments = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DEDUCCIONES', 14, yAfterAssignments);
  
  const colorRojo: Color = [185, 41, 41];
  autoTable(doc, {
    startY: yAfterAssignments + 5,
    head: [['Descripción', 'Monto USD']],
    body: data.deducciones.map(item => [item.descripcion, `$${item.monto.toFixed(2)}`]),
    theme: 'striped',
    headStyles: { fillColor: colorRojo },
    columnStyles: {
      1: { halign: 'right' as const }
    }
  });
  
  const yAfterDeductions = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  
  doc.setFillColor(240, 240, 240);
  doc.rect(14, yAfterDeductions, 180, 35, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN', 20, yAfterDeductions + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Total Asignaciones:', 20, yAfterDeductions + 18);
  doc.text(`$${data.totales.total_asignaciones.toFixed(2)}`, 160, yAfterDeductions + 18, { align: 'right' });
  
  doc.text('Total Deducciones:', 20, yAfterDeductions + 25);
  doc.text(`$${data.totales.total_deducciones.toFixed(2)}`, 160, yAfterDeductions + 25, { align: 'right' });
  
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('NETO A PAGAR:', 20, yAfterDeductions + 35);
  doc.setTextColor(...colorPrimario);
  doc.text(`$${data.totales.neto_pagar.toFixed(2)} USD`, 160, yAfterDeductions + 35, { align: 'right' });
  
  doc.setTextColor(...colorSecundario);
  doc.setFontSize(12);
  doc.text(`EQUIVALENTE: Bs. ${data.totales.neto_bs.toFixed(2)}`, 105, yAfterDeductions + 45, { align: 'center' });
  doc.setFontSize(9);
  doc.text(`(Tasa BCV: Bs. ${data.totales.tasa_cambio}/$)`, 105, yAfterDeductions + 50, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Documento generado el ${data.fecha_liquidacion}`, 105, 285, { align: 'center' });
  doc.text('Sistema de Gestión de Nómina Venezuela', 105, 290, { align: 'center' });
  
  return doc;
}

/**
 * Genera el PDF del Libro Diario Quincenal
 */
export function generarLibroDiario(
  liquidaciones: ReciboLiquidacionData[],
  periodo: { ano: number; mes: number; quincena: number }
): jsPDF {
  const doc = new jsPDF('landscape');
  
  const colorPrimario: Color = [41, 128, 185];
  
  doc.setFillColor(...colorPrimario);
  doc.rect(0, 0, 297, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('LIBRO DIARIO DE NÓMINA', 148, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Período: Quincena ${periodo.quincena} - ${periodo.mes}/${periodo.ano}`, 148, 22, { align: 'center' });
  
  const tableData = liquidaciones.map(l => [
    l.empleado.cedula,
    `${l.empleado.nombre} ${l.empleado.apellido}`,
    l.periodo.dias_trabajados,
    `$${l.totales.total_asignaciones.toFixed(2)}`,
    `$${l.totales.total_deducciones.toFixed(2)}`,
    `$${l.totales.neto_pagar.toFixed(2)}`,
    `Bs. ${l.totales.neto_bs.toFixed(2)}`
  ]);
  
  const totalAsignaciones = liquidaciones.reduce((sum, l) => sum + l.totales.total_asignaciones, 0);
  const totalDeducciones = liquidaciones.reduce((sum, l) => sum + l.totales.total_deducciones, 0);
  const totalNeto = liquidaciones.reduce((sum, l) => sum + l.totales.neto_pagar, 0);
  const totalBs = liquidaciones.reduce((sum, l) => sum + l.totales.neto_bs, 0);
  
  tableData.push([
    '',
    'TOTALES',
    liquidaciones.length,
    `$${totalAsignaciones.toFixed(2)}`,
    `$${totalDeducciones.toFixed(2)}`,
    `$${totalNeto.toFixed(2)}`,
    `Bs. ${totalBs.toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: 35,
    head: [['Cédula', 'Empleado', 'Días', 'Asignaciones', 'Deducciones', 'Neto USD', 'Neto Bs.']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: colorPrimario },
    columnStyles: {
      2: { halign: 'center' as const },
      3: { halign: 'right' as const },
      4: { halign: 'right' as const },
      5: { halign: 'right' as const, fontStyle: 'bold' as const },
      6: { halign: 'right' as const }
    },
    footStyles: { fillColor: [52, 73, 94] as Color, textColor: [255, 255, 255] as Color }
  });
  
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Libro generado el ${new Date().toLocaleDateString('es-VE')}`, 148, 200, { align: 'center' });
  
  return doc;
}

/**
 * Descarga el PDF
 */
export function descargarPDF(doc: jsPDF, nombreArchivo: string): void {
  doc.save(nombreArchivo);
}

export default {
  generarReciboLiquidacion,
  generarLibroDiario,
  descargarPDF
};
