// ============================================================
// GENERADOR DE PDF - Recibos de Liquidación
// Diseño similar a VENCARRY.COM, C.A.
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
    fecha_pago: string;
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
 * Genera el PDF del Recibo de Liquidación estilo VENCARRY.COM
 */
export function generarReciboLiquidacion(data: ReciboLiquidacionData): jsPDF {
  const doc = new jsPDF();
  
  // Colores VENCARRY
  const colorPrimario: Color = [0, 51, 102];  // Azul oscuro institucional
  const colorSecundario: Color = [51, 51, 51]; // Gris oscuro
  const colorVerde: Color = [0, 102, 51];      // Verde para valores positivos
  const colorRojo: Color = [153, 0, 0];        // Rojo para deducciones
  
  // === ENCABEZADO ===
  doc.setFillColor(...colorPrimario);
  doc.rect(0, 0, 220, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.empresa.nombre, 105, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`RIF: ${data.empresa.rif}`, 105, 22, { align: 'center' });
  doc.text(data.empresa.direccion || 'Venezuela', 105, 28, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RECIBO DE PAGO', 105, 38, { align: 'center' });
  
  // === INFORMACIÓN DEL PERIODO ===
  doc.setFillColor(240, 240, 240);
  doc.rect(0, 45, 220, 12, 'F');
  
  doc.setTextColor(...colorSecundario);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  const nombreMes = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ][data.periodo.mes - 1] || '';
  
  const periodoTexto = `Período: Quincena ${data.periodo.quincena} - ${nombreMes} ${data.periodo.ano}`;
  doc.text(periodoTexto, 15, 52);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de Pago: ${data.periodo.fecha_pago}`, 150, 52);
  
  // === DATOS DEL TRABAJADOR ===
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorPrimario);
  doc.text('DATOS DEL TRABAJADOR', 14, 68);
  
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 70, 196, 70);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colorSecundario);
  
  const nombresLabel = [
    { label: 'Cédula:', value: data.empleado.cedula, x: 14 },
    { label: 'Apellidos y Nombres:', value: `${data.empleado.apellido || ''} ${data.empleado.nombre}`.trim(), x: 80 },
    { label: 'Fecha Ingreso:', value: data.empleado.fecha_ingreso, x: 14 }
  ];
  
  let yPos = 78;
  nombresLabel.forEach(item => {
    doc.setFont('helvetica', 'bold');
    doc.text(item.label, item.x, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(item.value, item.x + 35, yPos);
    yPos += 6;
  });
  
  doc.text('Cargo:', 14, yPos);
  doc.text(data.empleado.cargo || 'Empleado', 35, yPos);
  doc.text('Dpto:', 110, yPos);
  doc.text(data.empleado.departamento || 'General', 125, yPos);
  
  // === CONCEPTOS DE PAGO ===
  yPos = 110;
  
  // Encabezado de tabla
  doc.setFillColor(...colorPrimario);
  doc.rect(14, yPos, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CONCEPTOS', 18, yPos + 5.5);
  doc.text('CANT./DÍAS', 100, yPos + 5.5);
  doc.text('MONTO (BS)', 155, yPos + 5.5);
  
  yPos += 12;
  
  // Asignaciones
  doc.setTextColor(...colorSecundario);
  doc.setFont('helvetica', 'bold');
  doc.text('ASIGNACIONES', 14, yPos);
  yPos += 5;
  
  doc.setFont('helvetica', 'normal');
  data.asignaciones.forEach(item => {
    const montoBs = item.monto * data.totales.tasa_cambio;
    doc.text(item.descripcion, 18, yPos);
    doc.text('15', 105, yPos);
    doc.setTextColor(...colorVerde);
    doc.text(`Bs. ${montoBs.toFixed(2)}`, 155, yPos, { align: 'right' });
    doc.setTextColor(...colorSecundario);
    yPos += 6;
  });
  
  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(14, yPos, 196, yPos);
  yPos += 6;
  
  // Deducciones
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorRojo);
  doc.text('DEDUCCIONES', 14, yPos);
  yPos += 5;
  
  doc.setFont('helvetica', 'normal');
  data.deducciones.forEach(item => {
    const montoBs = item.monto * data.totales.tasa_cambio;
    doc.text(item.descripcion, 18, yPos);
    doc.text(`Bs. ${montoBs.toFixed(2)}`, 155, yPos, { align: 'right' });
    yPos += 6;
  });
  
  // === RESUMEN ===
  yPos += 5;
  doc.setFillColor(245, 245, 245);
  doc.rect(100, yPos, 110, 30, 'F');
  
  doc.setTextColor(...colorSecundario);
  doc.setFontSize(10);
  
  // Total Asignaciones
  const totalAsignacionesBs = data.totales.total_asignaciones * data.totales.tasa_cambio;
  const totalDeduccionesBs = data.totales.total_deducciones * data.totales.tasa_cambio;
  
  doc.setFont('helvetica', 'normal');
  doc.text('TOTAL ASIGNACIONES:', 105, yPos + 8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorVerde);
  doc.text(`Bs. ${totalAsignacionesBs.toFixed(2)}`, 200, yPos + 8, { align: 'right' });
  
  // Total Deducciones
  yPos += 12;
  doc.setTextColor(...colorSecundario);
  doc.setFont('helvetica', 'normal');
  doc.text('TOTAL DEDUCCIONES:', 105, yPos + 8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorRojo);
  doc.text(`Bs. ${totalDeduccionesBs.toFixed(2)}`, 200, yPos + 8, { align: 'right' });
  
  // NETO A PAGAR
  yPos += 14;
  doc.setFillColor(...colorPrimario);
  doc.rect(100, yPos, 110, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('NETO A PAGAR:', 105, yPos + 8);
  doc.text(`Bs. ${data.totales.neto_bs.toFixed(2)}`, 200, yPos + 8, { align: 'right' });
  
  // Equivalente en USD (informativo)
  yPos += 20;
  doc.setTextColor(...colorSecundario);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`EQUIVALENTE INFORMATIVO EN USD: ${data.totales.neto_pagar.toFixed(2)}`, 105, yPos, { align: 'center' });
  
  // Tasa de cambio
  yPos += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  doc.text(`(Tasa BCV: Bs. ${data.totales.tasa_cambio.toFixed(2)} por USD)`, 105, yPos, { align: 'center' });
  
  // === PIE DE PÁGINA ===
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text(`Documento generado el ${data.fecha_liquidacion}`, 105, 280, { align: 'center' });
  doc.text('Sistema de Gestión de Nómina Venezuela - LOTTT', 105, 285, { align: 'center' });
  
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
  
  const colorPrimario: Color = [0, 51, 102];
  const colorVerde: Color = [0, 102, 51];
  const colorRojo: Color = [153, 0, 0];
  
  // Encabezado
  doc.setFillColor(...colorPrimario);
  doc.rect(0, 0, 297, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LIBRO DIARIO DE NÓMINA QUINCENAL', 148, 12, { align: 'center' });
  
  const nombreMes = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ][periodo.mes - 1] || '';
  
  doc.setFontSize(10);
  doc.text(`Período: Quincena ${periodo.quincena} - ${nombreMes} ${periodo.ano}`, 148, 20, { align: 'center' });
  
  // Datos de tabla
  const tableData = liquidaciones.map(l => [
    l.empleado.cedula,
    `${l.empleado.apellido || ''} ${l.empleado.nombre}`.trim(),
    l.periodo.dias_trabajados.toString(),
    `Bs. ${(l.totales.total_asignaciones * l.totales.tasa_cambio).toFixed(2)}`,
    `Bs. ${(l.totales.total_deducciones * l.totales.tasa_cambio).toFixed(2)}`,
    `Bs. ${l.totales.neto_bs.toFixed(2)}`,
    `${l.totales.neto_pagar.toFixed(2)}`
  ]);
  
  // Totales
  const totalAsignaciones = liquidaciones.reduce((sum, l) => sum + l.totales.total_asignaciones, 0);
  const totalDeducciones = liquidaciones.reduce((sum, l) => sum + l.totales.total_deducciones, 0);
  const totalNeto = liquidaciones.reduce((sum, l) => sum + l.totales.neto_pagar, 0);
  const totalBs = liquidaciones.reduce((sum, l) => sum + l.totales.neto_bs, 0);
  
  tableData.push([
    '',
    'TOTALES',
    liquidaciones.length.toString(),
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
    headStyles: { fillColor: colorPrimario, textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 50 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 35, halign: 'right' }
    },
    footStyles: { fillColor: [51, 51, 51], textColor: [255, 255, 255], fontStyle: 'bold' }
  });
  
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Libro generado el ${new Date().toLocaleDateString('es-VE')}`, 148, 200, { align: 'center' });
  
  return doc;
}

/**
 * Genera el Asiento de Diario Contable
 */
export function generarAsientoContable(
  liquidaciones: ReciboLiquidacionData[],
  empresa: { nombre: string; rif: string },
  periodo: { ano: number; mes: number; quincena: number },
  provisiones: { garantia: number; intereses: number; utilidades: number; bonoVacacional: number }
): jsPDF {
  const doc = new jsPDF();
  
  const colorPrimario: Color = [0, 51, 102];
  const colorSecundario: Color = [51, 51, 51];
  
  // Encabezado
  doc.setFillColor(...colorPrimario);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ASIENTO DE DIARIO - NÓMINA QUINCENAL', 105, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${empresa.nombre} - RIF: ${empresa.rif}`, 105, 23, { align: 'center' });
  
  const nombreMes = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ][periodo.mes - 1] || '';
  
  doc.text(`Período: Quincena ${periodo.quincena} - ${nombreMes} ${periodo.ano}`, 105, 30, { align: 'center' });
  
  // Calcular totales
  const totalNeto = liquidaciones.reduce((sum, l) => sum + l.totales.neto_pagar, 0);
  const totalAsignaciones = liquidaciones.reduce((sum, l) => sum + l.totales.total_asignaciones, 0);
  const totalIvss = liquidaciones.reduce((sum, l) => {
    const ivss = l.deducciones.find(d => d.descripcion.includes('IVSS'));
    return sum + (ivss?.monto || 0);
  }, 0);
  const totalFaov = liquidaciones.reduce((sum, l) => {
    const faov = l.deducciones.find(d => d.descripcion.includes('FAOV'));
    return sum + (faov?.monto || 0);
  }, 0);
  const totalRpe = liquidaciones.reduce((sum, l) => {
    const rpe = l.deducciones.find(d => d.descripcion.includes('RPE'));
    return sum + (rpe?.monto || 0);
  }, 0);
  
  const tablaAsiento = [
    // Debe - Gastos
    ['GASTO DE SUELDOS', `$${totalAsignaciones.toFixed(2)}`, '$0.00'],
    // Haber - Bancos
    ['BANCOS', '', `$${totalNeto.toFixed(2)}`],
    // Haber - Retenciones por pagar
    ['IVSS POR PAGAR', '', `$${totalIvss.toFixed(2)}`],
    ['FAOV POR PAGAR', '', `$${totalFaov.toFixed(2)}`],
    ['RPE POR PAGAR', '', `$${totalRpe.toFixed(2)}`],
    // Provisiones
    ['', '', ''],
    ['PROVISIONES DEL PERIODO', '', ''],
    ['PROVISIÓN GARANTÍA PS (Art. 142a)', '', `$${provisiones.garantia.toFixed(2)}`],
    ['PROVISIÓN INTERESES PS', '', `$${provisiones.intereses.toFixed(2)}`],
    ['PROVISIÓN ALÍCUOTA UTILIDADES', '', `$${provisiones.utilidades.toFixed(2)}`],
    ['PROVISIÓN BONO VACACIONAL', '', `$${provisiones.bonoVacacional.toFixed(2)}`],
  ];
  
  autoTable(doc, {
    startY: 45,
    head: [['CUENTA CONTABLE', 'DEBE (USD)', 'HABER (USD)']],
    body: tablaAsiento,
    theme: 'striped',
    headStyles: { fillColor: colorPrimario, textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 40, halign: 'right' },
      2: { cellWidth: 40, halign: 'right' }
    }
  });
  
  const totalDebe = totalAsignaciones + provisiones.garantia + provisiones.intereses + provisiones.utilidades + provisiones.bonoVacacional;
  const totalHaber = totalNeto + totalIvss + totalFaov + totalRpe + provisiones.garantia + provisiones.intereses + provisiones.utilidades + provisiones.bonoVacacional;
  
  // @ts-ignore - lastAutoTable es agregado por jspdf-autotable
  const finalY = doc.lastAutoTable?.finalY || 180;
  
  doc.setFontSize(10);
  doc.setTextColor(...colorSecundario);
  doc.text(`Total Débito: ${totalDebe.toFixed(2)}`, 150, finalY + 10, { align: 'right' });
  doc.text(`Total Crédito: ${totalHaber.toFixed(2)}`, 150, finalY + 16, { align: 'right' });
  
  // Pie de página
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text(`Asiento generado el ${new Date().toLocaleString('es-VE')}`, 105, 280, { align: 'center' });
  
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
  generarAsientoContable,
  descargarPDF
};
