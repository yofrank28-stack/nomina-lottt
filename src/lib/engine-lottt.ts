// ============================================================
// MOTOR DE CÁLCULOS LOTTT - Venezuela
// Ley Orgánica del Trabajo, los Trabajadores y las Trabajadoras
// ============================================================

export interface ParametrosNomina {
  salarioMinimo: number;
  numEmpleados: number;
  tasaCambio: number;
  umv: number;
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
  inces: number;
  total_deducciones: number;
}

export interface ResultadoLiquidacion {
  dias_trabajados: number;
  sueldo_diario: number;
  sueldo_base: number;
  bono_vacacional: number;
  utilidades: number;
  otras_asignaciones: number;
  total_asignaciones: number;
  ivss_trabajador: number;
  rpe_trabajador: number;
  faov_trabajador: number;
  inces_trabajador: number;
  otras_deducciones: number;
  total_deducciones: number;
  neto_pagar: number;
  neto_pagar_bs: number;
}

function calcularRetenciones(
  sueldoMensual: number,
  lunes: number,
  parametros: ParametrosNomina
): ResultadoRetenciones {
  const semanal = (sueldoMensual * 12) / 52;
  const topeSemanal = (parametros.salarioMinimo * 5 * 12) / 52;
  const baseCalculo = Math.min(semanal, topeSemanal);
  
  const ivss_trab = baseCalculo * 0.04 * lunes;
  const rpe_trab = baseCalculo * 0.005 * lunes;
  const faov_trab = sueldoMensual * 0.01;
  const inces = parametros.numEmpleados > 5 ? sueldoMensual * 0.005 : 0;
  
  const total_deducciones = ivss_trab + rpe_trab + faov_trab + inces;
  
  return {
    ivss_trab: Math.round(ivss_trab * 100) / 100,
    rpe_trab: Math.round(rpe_trab * 100) / 100,
    faov_trab: Math.round(faov_trab * 100) / 100,
    inces: Math.round(inces * 100) / 100,
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
  const diasBono = Math.min(15 + anosServicio, 30);
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
    
    const sueldoDiario = (sueldoBase * 12) / 360;
    const diasMes = 30;
    const sueldoPeriodo = Math.round((sueldoDiario * diasLaborados) * 100) / 100;
    
    const bonoVacacional = calcularBonoVacacional(new Date(fechaIngreso), sueldoBase);
    const utilidades = calcularUtilidades(new Date(fechaIngreso), sueldoBase);
    const otrasAsignaciones = 0;
    const totalAsignaciones = sueldoPeriodo + bonoVacacional + utilidades + otrasAsignaciones;
    
    const retenciones = calcularRetenciones(sueldoBase, lunesPeriodo, parametros);
    const totalDeducciones = retenciones.total_deducciones;
    const netoPagar = totalAsignaciones - totalDeducciones;
    const netoBs = netoPagar * parametros.tasaCambio;
    
    return {
      dias_trabajados: diasLaborados,
      sueldo_diario: Math.round(sueldoDiario * 100) / 100,
      sueldo_base: Math.round(sueldoPeriodo * 100) / 100,
      bono_vacacional: Math.round(bonoVacacional * 100) / 100,
      utilidades: Math.round(utilidades * 100) / 100,
      otras_asignaciones: otrasAsignaciones,
      total_asignaciones: Math.round(totalAsignaciones * 100) / 100,
      ivss_trabajador: retenciones.ivss_trab,
      rpe_trabajador: retenciones.rpe_trab,
      faov_trabajador: retenciones.faov_trab,
      inces_trabajador: retenciones.inces,
      otras_deducciones: 0,
      total_deducciones: totalDeducciones,
      neto_pagar: Math.round(netoPagar * 100) / 100,
      neto_pagar_bs: Math.round(netoBs * 100) / 100
    };
  }
};

export default engineLOTTT;
