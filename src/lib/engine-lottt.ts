// ============================================================
// MOTOR DE CÁLCULOS LOTTT - Venezuela
// Ley Orgánica del Trabajo, los Trabajadores y las Trabajadoras
// Fórmutas Exactas según Ley:
// - IVSS (4%): ((Sueldo Mensual * 12) / 52) * 0.04 * Lunes
// - FAOV (1%): Sueldo Mensual * 0.01
// - RPE (0.5%): ((Sueldo Mensual * 12) / 52) * 0.005 * Lunes
// - INCES Trabajador (0.5%): Solo en Utilidades/Aguinaldos, NO en nómina
// - INCES Patronal (2%): Solo si nómina >= 5 empleados
// ============================================================

export interface ParametrosNomina {
  salarioMinimo: number;
  numEmpleados: number;
  tasaCambio: number;
  umv: number;
  /** Tipo de concepto de pago: 'NOMINA' | 'UTILIDADES' | 'AGUINALDOS' */
  tipoConcepto?: 'NOMINA' | 'UTILIDADES' | 'AGUINALDOS';
  /** Si se debe pagar bono vacacional en esta liquidación */
  pagarBonoVacacional?: boolean;
  /** Si se debe pagar utilidades en esta liquidación */
  pagarUtilidades?: boolean;
  /** Bono de transporte - se paga en 2da quincena */
  bonoTransporte?: number;
  /** Cesta ticket - se paga en 2da quincena */
  cestaTicket?: number;
}

export interface DataEmpleado {
  diasLaborados: number;
  lunesPeriodo: number;
  acumuladoGarantia: number;
  ultimoSueldoIntegral: number;
  anosAntiguedad: number;
  bonoVacacional: number;
  utilidades: number;
  tieneHijos: boolean;
  cantidadHijos: number;
}

export interface ResultadoRetenciones {
  ivss_trab: number;
  rpe_trab: number;
  faov_trab: number;
  inces_trabajador: number;  // Solo aplica en Utilidades/Aguinaldos
  inces_patronal: number;    // 2% solo si >= 5 empleados
  total_deducciones: number;
}

export interface ResultadoLiquidacion {
  dias_trabajados: number;
  lunes_periodo: number;
  sueldo_diario: number;
 sueldo_base: number;
  bono_vacacional: number;
  utilidades: number;
  otras_asignaciones: number;
  total_asignaciones: number;
  ivss_trabajador: number;
  rpe_trabajador: number;
  faov_trabajador: number;
  inces_trabajador: number;   // Solo en Utilidades/Aguinaldos
  inces_patronal: number;     // 2% si >= 5 empleados
  otras_deducciones: number;
  total_deducciones: number;
  neto_pagar: number;
  neto_pagar_bs: number;
  bono_transporte: number;
  cesta_ticket: number;
}

function calcularRetenciones(
  sueldoMensual: number,
  lunes: number,
  parametros: ParametrosNomina
): ResultadoRetenciones {
  const semanal = (sueldoMensual * 12) / 52;
  const topeSemanal = (parametros.salarioMinimo * 5 * 12) / 52;
  const baseCalculo = Math.min(semanal, topeSemanal);
  
  // IVSS (4%): ((Sueldo Mensual * 12) / 52) * 0.04 * Lunes
  const ivss_trab = baseCalculo * 0.04 * lunes;
  
  // RPE (0.5%): ((Sueldo Mensual * 12) / 52) * 0.005 * Lunes
  const rpe_trab = baseCalculo * 0.005 * lunes;
  
  // FAOV (1%): Sueldo Mensual * 0.01
  const faov_trab = sueldoMensual * 0.01;
  
  // INCES Trabajador (0.5%): SOLO aplica en Utilidades o Aguinaldos, NO en nómina ordinaria
  const esConceptoEspecial = parametros.tipoConcepto === 'UTILIDADES' || parametros.tipoConcepto === 'AGUINALDOS';
  const inces_trabajador = esConceptoEspecial ? baseCalculo * 0.005 * lunes : 0;
  
  // INCES Patronal (2%): Solo si la empresa tiene 5 o más empleados
  const inces_patronal = parametros.numEmpleados >= 5 ? baseCalculo * 0.02 * lunes : 0;
  
  // Total deducciones trabajador (NO incluye INCES patronal - es costo empresa)
  const total_deducciones = ivss_trab + rpe_trab + faov_trab + inces_trabajador;
  
  return {
    ivss_trab: Math.round(ivss_trab * 100) / 100,
    rpe_trab: Math.round(rpe_trab * 100) / 100,
    faov_trab: Math.round(faov_trab * 100) / 100,
    inces_trabajador: Math.round(inces_trabajador * 100) / 100,
    inces_patronal: Math.round(inces_patronal * 100) / 100,
    total_deducciones: Math.round(total_deducciones * 100) / 100
  };
}

function calcularBonoVacacional(
  fechaIngreso: Date,
  sueldoMensual: number
): number {
  const hoy = new Date();
  const anosServicio = Math.floor(
    (hoy.getTime() - fechaIngreso.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  
  // Artículo 192 LOTTT - Días de bono vacacional por antigüedad
  let diasBono: number;
  if (anosServicio < 1) diasBono = 0;
  else if (anosServicio < 2) diasBono = 7;   // 1-2 años
  else if (anosServicio < 3) diasBono = 10;  // 2-3 años
  else if (anosServicio < 5) diasBono = 12;  // 3-5 años
  else if (anosServicio < 10) diasBono = 15; // 5-10 años
  else diasBono = 18;                         // 10+ años (máximo)
  
  const sueldoDiario = (sueldoMensual * 12) / 360;
  return Math.round(sueldoDiario * diasBono * 100) / 100;
}

function calcularUtilidades(
  fechaIngreso: Date,
  sueldoMensual: number
): number {
  const hoy = new Date();
  const anosServicio = Math.floor(
    (hoy.getTime() - fechaIngreso.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  let diasUtilidades: number;
  if (anosServicio < 1) diasUtilidades = 30;
  else if (anosServicio < 2) diasUtilidades = 45;
  else if (anosServicio < 5) diasUtilidades = 60;
  else if (anosServicio < 10) diasUtilidades = 90;
  else diasUtilidades = 120;
  const sueldoDiario = (sueldoMensual * 12) / 360;
  return Math.round(sueldoDiario * diasUtilidades * 100) / 100;
}

export const engineLOTTT = {
  calcularRetenciones,
  
  calcularIntegral: (base: number, bonoVac: number, utilidades: number): number => {
    const integral = base + (base * utilidades / 360) + (base * bonoVac / 360);
    return Math.round(integral * 100) / 100;
  },

  liquidarArt142: (data: DataEmpleado): number => {
    const { acumuladoGarantia, ultimoSueldoIntegral, anosAntiguedad } = data;
    const retroactividad = ultimoSueldoIntegral * 30 * Math.max(1, anosAntiguedad);
    const resultado = Math.max(acumuladoGarantia, retroactividad);
    return Math.round(resultado * 100) / 100;
  },

  calcularBonoVacacional,
  calcularUtilidades,

  procesarLiquidacion: (
    empleado: {
      diasLaborados: number;
      lunesPeriodo: number;
      sueldoBase: number;
      fechaIngreso: string;
      tieneHijos: boolean;
      cantidadHijos: number;
    },
    parametros: ParametrosNomina
  ): ResultadoLiquidacion => {
    const { diasLaborados, lunesPeriodo, sueldoBase, fechaIngreso } = empleado;
    
    const tipoConcepto = parametros.tipoConcepto || 'NOMINA';
    const pagarBonoVacacional = parametros.pagarBonoVacacional || false;
    const pagarUtilidades = parametros.pagarUtilidades || false;
    
    // Bono Transporte y Cesta Ticket: Solo en 2da quincena
    const bonoTransporte = parametros.bonoTransporte || 0;
    const cestaTicket = parametros.cestaTicket || 0;
    
    const diasMes = 30;
    const esSegundaQuincena = diasLaborados > 15;
    
    const sueldoDiario = (sueldoBase * 12) / 360;
    const diasLaboradosCalc = 15; // Por quincena
    const diasLaboradosFinal = diasLaborados > 0 ? diasLaborados : diasLaboradosCalc;
    const sueldoPeriodo = Math.round((sueldoDiario * diasLaboradosFinal) * 100) / 100;
    
    // Bono Vacacional: Solo si está habilitado y es nómina
    let bonoVacacional = 0;
    if (pagarBonoVacacional && tipoConcepto === 'NOMINA') {
      bonoVacacional = calcularBonoVacacional(new Date(fechaIngreso), sueldoBase);
    }
    
    // Utilidades: Solo si está habilitado y es nómina
    let utilidades = 0;
    if (pagarUtilidades && tipoConcepto === 'NOMINA') {
      utilidades = calcularUtilidades(new Date(fechaIngreso), sueldoBase);
    }
    
    const otrasAsignaciones = esSegundaQuincena ? bonoTransporte + cestaTicket : 0;
    const totalAsignaciones = sueldoPeriodo + bonoVacacional + utilidades + otrasAsignaciones;
    
    const retenciones = calcularRetenciones(sueldoBase, lunesPeriodo, parametros);
    const totalDeducciones = retenciones.total_deducciones;
    const netoPagar = totalAsignaciones - totalDeducciones;
    const netoBs = netoPagar * parametros.tasaCambio;
    
    return {
      dias_trabajados: diasLaborados,
      lunes_periodo: lunesPeriodo,
      sueldo_diario: Math.round(sueldoDiario * 100) / 100,
      sueldo_base: Math.round(sueldoPeriodo * 100) / 100,
      bono_vacacional: Math.round(bonoVacacional * 100) / 100,
      utilidades: Math.round(utilidades * 100) / 100,
      otras_asignaciones: Math.round(otrasAsignaciones * 100) / 100,
      total_asignaciones: Math.round(totalAsignaciones * 100) / 100,
      ivss_trabajador: retenciones.ivss_trab,
      rpe_trabajador: retenciones.rpe_trab,
      faov_trabajador: retenciones.faov_trab,
      inces_trabajador: retenciones.inces_trabajador,
      inces_patronal: retenciones.inces_patronal,
      otras_deducciones: 0,
      total_deducciones: totalDeducciones,
      neto_pagar: Math.round(netoPagar * 100) / 100,
      neto_pagar_bs: Math.round(netoBs * 100) / 100,
      // Agregar bonificaciones para el receipt
      bono_transporte: esSegundaQuincena ? bonoTransporte : 0,
      cesta_ticket: esSegundaQuincena ? cestaTicket : 0
    };
  }
};

export default engineLOTTT;
