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
  /** Si se debe pagar bono vacacional en esta liquidación (global) */
  pagarBonoVacacional?: boolean;
  /** Si se debe pagar utilidades en esta liquidación (global) */
  pagarUtilidades?: boolean;
  /** Bono de transporte - se paga en 2da quincena */
  bonoTransporte?: number;
  /** Cesta ticket - se paga en 2da quincena */
  cestaTicket?: number;
  /** Fecha de inicio del período de nómina */
  fechaInicioPeriodo?: string;
  /** Fecha de fin del período de nómina */
  fechaFinPeriodo?: string;
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
  // Campos para cálculos proporcionales
  fechaIngreso: string;
  fechaEgreso?: string;
  // Beneficios individuales por trabajador
  pagarBonoVacacionalIndividual?: boolean;
  pagarUtilidadesIndividual?: boolean;
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
  
  // INCES Trabajador (0.5%): SOLO aplica en Utilidades/Aguinaldos Y solo si la empresa tiene 5+ empleados
  const esConceptoEspecial = parametros.tipoConcepto === 'UTILIDADES' || parametros.tipoConcepto === 'AGUINALDOS';
  const tieneSuficientesEmpleados = parametros.numEmpleados >= 5;
  const inces_trabajador = esConceptoEspecial && tieneSuficientesEmpleados ? baseCalculo * 0.005 * lunes : 0;
  
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

/**
 * Calcula los días efectivos laborados en función de las fechas de ingreso/egreso
 * @param fechaIngreso Fecha de ingreso del empleado
 * @param fechaEgreso Fecha de egreso (opcional)
 * @param fechaInicioPeriodo Inicio del período de nómina
 * @param fechaFinPeriodo Fin del período de nómina
 * @returns Días efectivamente laborados
 */
export function calcularDiasLaboradosProporcional(
  fechaIngreso: string,
  fechaEgreso: string | undefined,
  fechaInicioPeriodo: string,
  fechaFinPeriodo: string
): number {
  const ingreso = new Date(fechaIngreso);
  const egreso = fechaEgreso ? new Date(fechaEgreso) : null;
  const inicio = new Date(fechaInicioPeriodo);
  const fin = new Date(fechaFinPeriodo);
  
  // Días totales del período
  const diasPeriodo = Math.ceil((fin.getTime() - inicio.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  
  // Si el empleado ingressó después del inicio del período
  if (ingreso > inicio) {
    const diasDesdeIngreso = Math.ceil((fin.getTime() - ingreso.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    return Math.min(diasDesdeIngreso, diasPeriodo);
  }
  
  // Si el empleado egresó antes del fin del período
  if (egreso && egreso < fin) {
    const diasHastaEgreso = Math.ceil((egreso.getTime() - inicio.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    return Math.max(0, Math.min(diasHastaEgreso, diasPeriodo));
  }
  
  // Caso normal: empleado trabajó todo el período
  return diasPeriodo;
}

/**
 * Calcula el factor proporcional de vacaciones
 * @param fechaIngreso Fecha de ingreso
 * @param fechaCorte Fecha de corte para el cálculo (usualmente fecha de egreso o fin de período)
 * @returns Factor proporcional de vacaciones (días equivalentes)
 */
export function calcularVacacionesProporcionales(
  fechaIngreso: string,
  fechaCorte?: string
): number {
  const ingreso = new Date(fechaIngreso);
  const corte = fechaCorte ? new Date(fechaCorte) : new Date();
  
  // Calcular meses completos de servicio
  const mesesServicio = Math.max(0, (corte.getFullYear() - ingreso.getFullYear()) * 12 + 
    (corte.getMonth() - ingreso.getMonth()));
  
  // Fórmula: 1.25 días por mes (15 días / 12 meses)
  const diasProporcionales = mesesServicio * 1.25;
  
  return Math.round(diasProporcionales * 100) / 100;
}

/**
 * Calcula las utilidades proporcionales según los meses trabajados en el año
 * @param fechaIngreso Fecha de ingreso
 * @param anoFiscal Año fiscal para el cálculo
 * @returns Días proporcionales de utilidades
 */
export function calcularUtilidadesProporcionales(
  fechaIngreso: string,
  anoFiscal: number
): number {
  const ingreso = new Date(fechaIngreso);
  const inicioAno = new Date(anoFiscal, 0, 1);
  const finAno = new Date(anoFiscal, 11, 31);
  
  // Si ingressó después del inicio del año, calcular meses desde entonces
  let fechaInicioCalculo = inicioAno > ingreso ? inicioAno : ingreso;
  
  // Calcular meses completos desde inicio del cálculo hasta fin del año
  const meses = Math.max(0, (finAno.getFullYear() - fechaInicioCalculo.getFullYear()) * 12 + 
    (finAno.getMonth() - fechaInicioCalculo.getMonth()));
  
  // Días de utilidades por mes (30 días base / 12 meses = 2.5 días por mes)
  const diasBase = 30; // Días mínimos de utilidades
  const diasPorMes = diasBase / 12;
  const diasProporcionales = meses * diasPorMes;
  
  return Math.round(diasProporcionales * 100) / 100;
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
  calcularDiasLaboradosProporcional,
  calcularVacacionesProporcionales,
  calcularUtilidadesProporcionales,

  procesarLiquidacion: (
    empleado: {
      diasLaborados: number;
      lunesPeriodo: number;
      sueldoBase: number;
      fechaIngreso: string;
      tieneHijos: boolean;
      cantidadHijos: number;
      // Nuevos campos para cálculos individuales
      fechaEgreso?: string;
      pagarBonoVacacionalIndividual?: boolean;
      pagarUtilidadesIndividual?: boolean;
      // Fechas del período para cálculos proporcionales
      fechaInicioPeriodo?: string;
      fechaFinPeriodo?: string;
    },
    parametros: ParametrosNomina
  ): ResultadoLiquidacion => {
    const { diasLaborados, lunesPeriodo, sueldoBase, fechaIngreso, fechaEgreso } = empleado;
    
    const tipoConcepto = parametros.tipoConcepto || 'NOMINA';
    // Usar el flag individual si está definido, si no usar el global
    const pagarBonoVacacional = empleado.pagarBonoVacacionalIndividual ?? parametros.pagarBonoVacacional ?? false;
    const pagarUtilidades = empleado.pagarUtilidadesIndividual ?? parametros.pagarUtilidades ?? false;
    
    // Bono Transporte y Cesta Ticket: Solo en 2da quincena
    const bonoTransporte = parametros.bonoTransporte || 0;
    const cestaTicket = parametros.cestaTicket || 0;
    
    const esSegundaQuincena = diasLaborados > 15;
    
    // === CÁLCULOS PROPORCIONALES ===
    let diasLaboradosCalc = 15; // Por quincena
    let factorProporcional = 1; // Factor para vacaciones/utilidades proporcionales
    
    // Si hay fechas de período, calcular días proporcionales
    if (parametros.fechaInicioPeriodo && parametros.fechaFinPeriodo) {
      diasLaboradosCalc = calcularDiasLaboradosProporcional(
        fechaIngreso,
        fechaEgreso,
        parametros.fechaInicioPeriodo,
        parametros.fechaFinPeriodo
      );
      // Factor proporcional: días laborados / días del período (30 días)
      factorProporcional = diasLaboradosCalc / 30;
    }
    
    const diasLaboradosFinal = diasLaborados > 0 ? diasLaborados : diasLaboradosCalc;
    const diasParaCalculo = Math.min(diasLaboradosFinal, 30);
    
    const sueldoDiario = (sueldoBase * 12) / 360;
    const sueldoPeriodo = Math.round((sueldoDiario * diasParaCalculo) * 100) / 100;
    
    // Bono Vacacional: Solo si está habilitado y es nómina
    // Si hay cálculo proporcional, aplicar factor
    let bonoVacacional = 0;
    if (pagarBonoVacacional && tipoConcepto === 'NOMINA') {
      const bonoCompleto = calcularBonoVacacional(new Date(fechaIngreso), sueldoBase);
      bonoVacacional = Math.round(bonoCompleto * factorProporcional * 100) / 100;
    }
    
    // Utilidades: Solo si está habilitado y es nómina
    // Si hay cálculo proporcional, usar cálculo proporcional
    let utilidades = 0;
    if (pagarUtilidades && tipoConcepto === 'NOMINA') {
      if (parametros.fechaInicioPeriodo && parametros.fechaFinPeriodo) {
        // Usar cálculo proporcional
        const anoFiscal = new Date(parametros.fechaFinPeriodo).getFullYear();
        const diasProporcionales = calcularUtilidadesProporcionales(fechaIngreso, anoFiscal);
        const sueldoDiarioAnual = (sueldoBase * 12) / 360;
        utilidades = Math.round(sueldoDiarioAnual * diasProporcionales * 100) / 100;
      } else {
        // Cálculo normal completo
        utilidades = calcularUtilidades(new Date(fechaIngreso), sueldoBase);
      }
    }
    
    const otrasAsignaciones = esSegundaQuincena ? bonoTransporte + cestaTicket : 0;
    const totalAsignaciones = Math.round((sueldoPeriodo + bonoVacacional + utilidades + otrasAsignaciones) * 100) / 100;
    
    // Ajustar retenciones según días trabajados
    const factorRetenciones = diasLaboradosFinal / 30;
    const retencionesBase = calcularRetenciones(sueldoBase, lunesPeriodo, parametros);
    const retenciones = {
      ivss_trab: Math.round(retencionesBase.ivss_trab * factorRetenciones * 100) / 100,
      rpe_trab: Math.round(retencionesBase.rpe_trab * factorRetenciones * 100) / 100,
      faov_trab: Math.round(retencionesBase.faov_trab * factorRetenciones * 100) / 100,
      inces_trabajador: Math.round(retencionesBase.inces_trabajador * factorRetenciones * 100) / 100,
      inces_patronal: Math.round(retencionesBase.inces_patronal * factorRetenciones * 100) / 100,
      total_deducciones: Math.round(retencionesBase.total_deducciones * factorRetenciones * 100) / 100
    };
    
    const totalDeducciones = retenciones.total_deducciones;
    const netoPagar = Math.round((totalAsignaciones - totalDeducciones) * 100) / 100;
    const netoBs = netoPagar * parametros.tasaCambio;
    
    return {
      dias_trabajados: diasLaboradosFinal,
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
      total_deducciones: Math.round(totalDeducciones * 100) / 100,
      neto_pagar: Math.round(netoPagar * 100) / 100,
      neto_pagar_bs: Math.round(netoBs * 100) / 100,
      // Agregar bonificaciones para el receipt
      bono_transporte: esSegundaQuincena ? bonoTransporte : 0,
      cesta_ticket: esSegundaQuincena ? cestaTicket : 0
    };
  }
};

// ============================================================
// CÁLCULO DE PRESTACIONES SOCIALES - DOBLE VÍA (LOTTT Art. 142)
// ============================================================

export interface PrestacionCalculada {
  // Garantía (Art. 142.a) - 5 días por mes
  garantia: number;
  dias_garantia: number;
  // Retroactividad (Leyes anteriores) - Diferencia entre旧 y nuevo cálculo
  retroactividad: number;
  dias_retroactividad: number;
  // Intereses sobre Prestaciones (Art. 143)
  intereses: number;
  tasa_activa: number;
  // Totales
  total_antiguedad: number;
  total_prestacion: number;
  // Salary Integral
  salary_integral: number;
  // Detalle para comparativo legal
  detalle: {
    salario_base: number;
    bono_vacacional_mensual: number;
    utilidades_mensuales: number;
    total_dias_laborados: number;
    factor_actualizacion: number;
  };
}

// Función para calcular Prestaciones Sociales con Doble Vía
export function calcularPrestaciones(
  fechaIngreso: string,
  fechaEgreso: string,
  ultimoSueldo: number,
  diasAcumuladosGarantia: number,
  tasaActivaAnual: number,
  riesgoIvss: number = 9 // Por defecto 9%
): PrestacionCalculada {
  const ingreso = new Date(fechaIngreso);
  const egreso = new Date(fechaEgreso);
  
  // Calcular antigüedad en días
  const diffTime = egreso.getTime() - ingreso.getTime();
  const diasTotales = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Días de garantía: 5 días por mes (máximo según antigüedad)
  const diasGarantia = Math.min(diasAcumuladosGarantia, Math.floor(diasTotales / 30) * 5);
  
  // Cálculo Salary Integral (Art. 104 LOTTT)
  // = Salario base + Bono Vacacional (15 días) + Utilidades (30 días)
  const bonoVacacionalDiario = (ultimoSueldo * 12) / 360;
  const utilidadesDiario = (ultimoSueldo * 12) / 360;
  const salaryIntegral = ultimoSueldo + (bonoVacacionalDiario * 15 / 12) + (utilidadesDiario * 30 / 12);
  
  // GARANTÍA (Art. 142.a - 5 días por mes)
  const garantia = (salaryIntegral / 30) * diasGarantia;
  
  // RETROACTIVIDAD (Cálculo diferenciado por antigüedad)
  // Para trabajadores con más de 5 años: aplica retroactividad
  const anosAntiguedad = diasTotales / 365;
  let retroactividad = 0;
  let diasRetro = 0;
  
  if (anosAntiguedad >= 5) {
    // Cálculo retroactivo: Diferencia entre旧 sistema (90 días) y nuevo (15 días)
    diasRetro = Math.max(0, 90 - Math.floor(diasTotales / 30));
    retroactividad = (salaryIntegral / 30) * diasRetro * 0.5; // 50% adicional
  }
  
  // INTERESES sobre Prestaciones (Art. 143)
  // Tasa activa mensual = tasa anual / 12 / 100
  const tasaActivaMensual = tasaActivaAnual / 12 / 100;
  const intereses = (garantia + retroactividad) * tasaActivaMensual * (diasTotales / 30);
  
  return {
    garantia: Math.round(garantia * 100) / 100,
    dias_garantia: diasGarantia,
    retroactividad: Math.round(retroactividad * 100) / 100,
    dias_retroactividad: diasRetro,
    intereses: Math.round(intereses * 100) / 100,
    tasa_activa: tasaActivaAnual,
    total_antiguedad: Math.round((garantia + retroactividad + intereses) * 100) / 100,
    total_prestacion: Math.round((garantia + retroactividad + intereses) * 100) / 100,
    salary_integral: Math.round(salaryIntegral * 100) / 100,
    detalle: {
      salario_base: ultimoSueldo,
      bono_vacacional_mensual: Math.round(bonoVacacionalDiario * 15 / 12 * 100) / 100,
      utilidades_mensuales: Math.round(utilidadesDiario * 30 / 12 * 100) / 100,
      total_dias_laborados: diasTotales,
      factor_actualizacion: Math.round((salaryIntegral / ultimoSueldo) * 100) / 100
    }
  };
}

// ============================================================
// BONO VACACIONAL - Escala LOTTT (Art. 127)
// 15 días + 1 día por cada año adicional (máximo 30 días)
// ============================================================

export function calcularBonoVacacionalEscala(
  fechaIngreso: string,
  salaryIntegral: number
): { dias: number; monto: number } {
  const ingreso = new Date(fechaIngreso);
  const hoy = new Date();
  
  const diffTime = hoy.getTime() - ingreso.getTime();
  const anosAntiguedad = Math.floor(diffTime / (365.25 * 24 * 60 * 60 * 1000));
  
  // Días de bono según antigüedad
  let dias = 15;
  if (anosAntiguedad >= 1) dias += 1; // 1 día adicional por año
  if (anosAntiguedad >= 2) dias += 1;
  if (anosAntiguedad >= 3) dias += 1;
  if (anosAntiguedad >= 4) dias += 1;
  if (anosAntiguedad >= 5) dias += 2; // A partir del 5to año, +2 días
  // Máximo 30 días
  dias = Math.min(dias, 30);
  
  // Cálculo del monto
  const diario = (salaryIntegral * 12) / 360;
  const monto = diario * dias;
  
  return { dias, monto: Math.round(monto * 100) / 100 };
}

// ============================================================
// UTILIDADES PERSONALIZABLES (Art. 131-132 LOTTT)
// 15 a 30 días de salario según utilidades de la empresa
// ============================================================

export function calcularUtilidadesPersonalizables(
  fechaIngreso: string,
  salaryIntegral: number,
  diasConfigurados: number = 15 // Por defecto 15 días, configurable
): { dias: number; monto: number } {
  const ingreso = new Date(fechaIngreso);
  const hoy = new Date();
  
  const diffTime = hoy.getTime() - ingreso.getTime();
  const mesesAntiguedad = Math.floor(diffTime / (30.44 * 24 * 60 * 60 * 1000));
  
  // Proporcional según meses trabajados en el año
  const proporcion = Math.min(mesesAntiguedad / 12, 1);
  const dias = Math.floor(diasConfigurados * proporcion);
  
  // Cálculo del monto
  const diario = (salaryIntegral * 12) / 360;
  const monto = diario * Math.max(dias, 1); // Mínimo 1 día
  
  return { dias, monto: Math.round(monto * 100) / 100 };
}

// ============================================================
// CONTRIBUCIÓN ESPECIAL 9% (Ley de Protección a Pensiones)
// Base indexada = Salario Mínimo × Factor de Indexación
// ============================================================

export function calcularContribucionEspecial(
  salaryIntegral: number,
  salarioMinimo: number,
  tasaCambio: number
): { base: number; contribucion: number; exonerada: boolean } {
  // Factor de indexación (ejemplo: 5 veces el salario mínimo)
  const factorIndexacion = 5;
  const baseIndexada = salarioMinimo * factorIndexacion;
  
  // La contribución solo aplica si el salary integral excede la base indexada
  if (salaryIntegral <= baseIndexada) {
    return { base: baseIndexada, contribucion: 0, exonerada: true };
  }
  
  const base = salaryIntegral - baseIndexada;
  const contribucion = base * 0.09; // 9%
  
  return {
    base: Math.round(base * 100) / 100,
    contribucion: Math.round(contribucion * 100) / 100,
    exonerada: false
  };
}

// ============================================================
// GENERADOR DE ARCHIVOS TXT PARA BANCOS
// ============================================================

export interface RegistroBanco {
  cedula: string;
  nombre: string;
  banco: string;
  numero_cuenta: string;
  tipo_cuenta: 'C' | 'A'; // Corriente / Ahorro
  monto: number;
  concepto?: string;
}

export function generarTxtBancos(
  registros: RegistroBanco[],
  formato: 'BANESCO' | 'MERCANTIL' | 'VENEZUELA' | 'PROVINCIAL' | 'OTRO'
): string {
  const lineas: string[] = [];
  
  // Header según formato
  const fecha = new Date().toISOString().split('T')[0].replace(/-/g, '');
  lineas.push(`H|${formato}|${fecha}|${registros.length}`);
  
  // Detalle de cada registro
  registros.forEach((r, idx) => {
    const montoStr = r.monto.toFixed(2).replace('.', '');
    const linea = [
      'D',
      (idx + 1).toString().padStart(6, '0'),
      r.cedula.replace(/[VEv]-/g, ''),
      r.nombre.substring(0, 40).padEnd(40, ' '),
      r.banco.substring(0, 4).padEnd(4, ' '),
      r.numero_cuenta.padEnd(20, ' '),
      r.tipo_cuenta,
      montoStr.padStart(15, '0'),
      r.concepto?.substring(0, 30).padEnd(30, ' ') || ''.padEnd(30, ' ')
    ].join('|');
    lineas.push(linea);
  });
  
  // Footer
  const total = registros.reduce((sum, r) => sum + r.monto, 0);
  lineas.push(`T|${registros.length}|${total.toFixed(2).replace('.', '').padStart(18, '0')}`);
  
  return lineas.join('\n');
}

// ============================================================
// GENERADOR DE REPORTES PARA ENTES
// ============================================================

export function generarReporteTIUNA(
  empleados: any[],
  empresa: any,
  periodo: string
): string {
  const lineas: string[] = [];
  
  // Header
  lineas.push(`EMPRESA|${empresa.rif}|${empresa.nombre}`);
  lineas.push(`PERIODO|${periodo}`);
  lineas.push(`CANTIDAD_TRABAJADORES|${empleados.length}`);
  lineas.push('---DETALLE---');
  
  // Empleados
  empleados.forEach(emp => {
    lineas.push([
      emp.cedula,
      emp.nombre,
      emp.apellido,
      emp.cargo || '',
      emp.sueldo_base.toFixed(2),
      emp.tipo_contrato
    ].join('|'));
  });
  
  return lineas.join('\n');
}

export function generarReporteBANAVIH(
  empleados: any[],
  empresa: any,
  periodo: string
): string {
  const lineas: string[] = [];
  
  lineas.push(`RIF|${empresa.rif}`);
  lineas.push(`RAZON_SOCIAL|${empresa.nombre}`);
  lineas.push(`PERIODO|${periodo}`);
  lineas.push(`---NÓMINA---`);
  
  empleados.forEach(emp => {
    const aportaciones = (emp.sueldo_base * 0.02).toFixed(2); // 2% BANAVIH
    lineas.push(`${emp.cedula}|${emp.nombre}|${emp.sueldo_base.toFixed(2)}|${aportaciones}`);
  });
  
  return lineas.join('\n');
}

export function generarReporteSENIAT(
  empleados: any[],
  empresa: any,
  periodo: string
): string {
  const lineas: string[] = [];
  
  // Formato ASXML para SENIAT
  lineas.push('<?xml version="1.0" encoding="UTF-8"?>');
  lineas.push('<DeclaracionISLR>');
  lineas.push(`  <RifContribuyente>${empresa.rif}</RifContribuyente>`);
  lineas.push(`  <Periodo>${periodo}</Periodo>`);
  lineas.push('  <Detalle>');
  
  empleados.forEach(emp => {
    // Calcular retención 2.5% - 10% según tabla
    const ingresoAnual = emp.sueldo_base * 12;
    let retencion = 0;
    if (ingresoAnual > 15000) retencion = ingresoAnual * 0.025;
    if (ingresoAnual > 25000) retencion = ingresoAnual * 0.05;
    if (ingresoAnual > 50000) retencion = ingresoAnual * 0.10;
    
    lineas.push(`    <Trabajador>`);
    lineas.push(`      <Cedula>${emp.cedula}</Cedula>`);
    lineas.push(`      <Nombre>${emp.nombre} ${emp.apellido || ''}</Nombre>`);
    lineas.push(`      <IngresoGravado>${ingresoAnual.toFixed(2)}</IngresoGravado>`);
    lineas.push(`      <Retencion>${retencion.toFixed(2)}</Retencion>`);
    lineas.push(`    </Trabajador>`);
  });
  
  lineas.push('  </Detalle>');
  lineas.push('</DeclaracionISLR>');
  
  return lineas.join('\n');
}

export default engineLOTTT;
