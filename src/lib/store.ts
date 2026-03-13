// ============================================================
// GESTIÓN DE ESTADO - Zustand Store
// ============================================================

import { create } from 'zustand';
import { 
  guardarTasaActiva as guardarTasaActivaBCV, 
  getTasaActivaPorMes,
  getHistorialTasasActivas,
  getUltimaTasaCambio,
  getHistorialTasasCambio,
  HistoricoTasaActiva,
  HistoricoTasaCambio,
  guardarTasaActivaConRecalculo,
  getAuditoriaCambiosTasas
} from './bcv-service';

// Tipos

export type EmpresaStatus = 'active' | 'suspended' | 'terminated';

export interface Empresa {
  id: number;
  rif: string;
  nombre: string;
  razon_social?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  lunes_mes: number;
  es_inces_contribuyente: boolean;
  status?: EmpresaStatus;
  // Datos de contacto para pagos (cuando status = suspended)
  admin_master_email?: string;
  admin_master_telefono?: string;
  admin_master_zelle?: string;
  admin_master_zinli?: string;
  admin_master_pago_movil?: string;
  admin_master_banco?: string;
  admin_master_cuenta?: string;
  // Datos de terminación
  fecha_terminacion?: string;
  expediente_descargado?: boolean;
}

export interface Usuario {
  id: number;
  username: string;
  nombre_completo: string;
  rol: 'ADMIN_MAESTRO' | 'ADMIN_EMPRESA' | 'OPERADOR';
  empresa_id?: number;
  empresas_permitidas?: number[]; // IDs de empresas que puede ver/gestionar
  es_super_admin?: boolean; //true solo para ADMIN_MAESTRO
}

export interface Empleado {
  id: number;
  empresa_id: number;
  cedula: string;
  nombre: string;
  apellido?: string;
  fecha_nacimiento?: string;
  fecha_ingreso: string;
  fecha_egreso?: string;
  cargo?: string;
  departamento?: string;
  sueldo_base: number;  // Monto del sueldo base
  tipo_moneda_sueldo: 'USD' | 'VES';  // Tipo de moneda del sueldo base
  estatus: 'ACTIVO' | 'VACACIONES' | 'EGRESADO' | 'SUSPENDIDO';
  tipo_contrato: 'FIJO' | 'INDEFINIDO' | 'TEMPORAL';
  tiene_hijos: boolean;
  cantidad_hijos: number;
  empresa_nombre?: string; // Nombre de la empresa para mostrar
  // Beneficios individuales (por trabajador)
  pagar_bono_vacacional?: boolean;  // Bono vacacional individual
  pagar_utilidades?: boolean;        // Utilidades individual
}

export interface Parametros {
  ano: number;
  mes: number;
  salario_minimo: number;
  tasa_cambio: number;
  tasa_activa: number;  // Tasa activa BCV para prestaciones sociales
  umv: number;
  fecha_actualizacion_tasa?: string;
  tipo_moneda: 'USD' | 'VES';  // Tipo de moneda
  bono_transporte: number;  // Bono de transporte ($120)
  cesta_ticket: number;  // Cesta ticket ($40)
}

export interface ConceptoManual {
  id: string;
  denominacion: string;
  tipo: 'MONTO_FIJO' | 'PORCENTAJE';
  valor: number;
  observaciones: string;
  activo: boolean;
}

// Conceptos patronales definibles - Aportes del empleador configurables
// Se calculan automáticamente cuando el empleado tiene una deducción manual específica activa
export interface ConceptoPatronal {
  id: string;
  /** Nombre del aporte patronalej. "Aporte Patronal Caja de Ahorro" */
  denominacion: string;
  /** Tipo de valor: Monto fijo o Porcentaje */
  tipo: 'MONTO_FIJO' | 'PORCENTAJE';
  /** Valor del aporte (monto o porcentaje según tipo) */
  valor: number;
  /** ID del concepto de deducción manual que activa este aporte */
  concepto_trigger_id: string;
  /** Nombre del trigger para mostrar en UI */
  concepto_trigger_nombre: string;
  /** Cuenta contable de gasto (DEBE) */
  cuenta_gasto: string;
  /** Cuenta contable de pasivo (HABER) */
  cuenta_pasivo: string;
  /** Si es true, el monto NO aparece en el recibo de pago */
  solo_contable: boolean;
  /** Si el concepto está activo para usar */
  activo: boolean;
}

export interface Liquidacion {
  id?: number;
  empleado_id: number;
  empresa_id: number;
  periodo: string;
  ano: number;
  mes: number;
  quincena: number;
  dias_trabajados: number;
  lunes_periodo?: number;
  sueldo_base: number;
  bono_vacacional: number;
  utilidades: number;
  otras_asignaciones: number;
  total_asignaciones: number;
  ivss_trabajador: number;
  rpe_trabajador: number;
  faov_trabajador: number;
  inces_trabajador: number;   // Solo aplica en Utilidades/Aguinaldos
  inces_patronal: number;      // 2% si >= 5 empleados
  otras_deducciones: number;
  total_deducciones: number;
  neto_pagar: number;
  tipo_cambio_usd: number;
  monto_bs: number;
  fecha_liquidacion?: string;
  // Auditoría de tasa BCV utilizada (por trabajador individual)
  tasa_bcv_fecha?: string;  // Fecha cuando se obtuvo la tasa BCV
  tasa_bcv_oficial?: number;  // Tasa BCV oficial utilizada
  // Bonificaciones especiales
  bono_transporte?: number;
  cesta_ticket?: number;
  // Conceptos manuales (persistencia en histórico)
  conceptos_asignaciones?: ConceptoManual[];
  conceptos_deducciones?: ConceptoManual[];
}

// Interface para lote de espera (batch processing)
export interface LoteEspera {
  empleado_id: number;
  empleado_nombre: string;
  empleado_cedula: string;
  liquidacion: Liquidacion;
  fecha_agregado: string;
}

// Interface para Asiento Contable
export interface AsientoContable {
  id: string;
  empresa_id: number;
  empresa_nombre: string;
  periodo: string;
  ano: number;
  mes: number;
  quincena: number;
  fecha_generacion: string;
  // Datos del Debe (Gastos)
  gasto_sueldos: number;
  gasto_prestaciones: number;
  gasto_intereses: number;
  gasto_utilidades: number;
  gasto_bono_vacacional: number;
  total_debe: number;
  // Datos del Haber (Acreedores)
  neto_pagar_banco: number;
  ivss_trabajador_por_pagar: number;
  ivss_patronal_por_pagar: number;
  faov_trabajador_por_pagar: number;
  faov_patronal_por_pagar: number;
  spf_por_pagar: number;
  inces_por_pagar: number;
  aportes_especiales_por_pagar: number;
  total_haber: number;
  // Conceptos patronales definibles - Pasivos por pagar
  conceptos_patronales_detalle?: {
    concepto_id: string;
    denominacion: string;
    cuenta_gasto: string;
    cuenta_pasivo: string;
    monto: number;
  }[];
  total_pasivos_patronales?: number;
  // Detalle por empleado
  empleados: {
    empleado_id: number;
    nombre: string;
    cedula: string;
    sueldo_base: number;
    neto_pagar: number;
  }[];
}

interface AppState {
  // Autenticación
  usuario: Usuario | null;
  isAuthenticated: boolean;
  
  // Datos
  empresas: Empresa[];
  empresasPermitidas: number[]; // IDs de empresas que el usuario puede ver
  empresaSeleccionadaId: number | null; // Empresa actualmente seleccionada
  empleados: Empleado[];
  liquidaciones: Liquidacion[];
  parametros: Parametros;
  
  // UI
  currentView: 'dashboard' | 'empresas' | 'empleados' | 'nomina' | 'reportes' | 'parametros' | 'contabilidad';
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  
  // Tasa BCV
  tasaCambio: number;
  tasaActiva: number;  // Tasa activa para prestaciones sociales
  historialTasasActivas: HistoricoTasaActiva[];  // Historial de tasas activas
  historialTasasCambio: HistoricoTasaCambio[];  // Historial de tasas de cambio
  auditoriaCambiosTasas: any[];  // Auditoría de cambios de tasas
  
  // Acciones
  setUsuario: (usuario: Usuario | null) => void;
  setEmpresas: (empresas: Empresa[]) => void;
  setEmpresasPermitidas: (empresas: number[]) => void;
  setEmpresaSeleccionada: (id: number | null) => void;
  getEmpresasfiltradas: () => Empresa[];
  getEmpleadosFiltrados: () => Empleado[];
  puedeGestionarEmpresa: (empresaId: number) => boolean;
  puedeVerTodasEmpresas: () => boolean;
  setEmpleados: (empleados: Empleado[]) => void;
  setLiquidaciones: (liquidaciones: Liquidacion[]) => void;
  setParametros: (parametros: Parametros) => void;
  setCurrentView: (view: AppState['currentView']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  setTasaCambio: (tasa: number) => void;
  setTasaActiva: (tasa: number) => void;
  guardarTasaActiva: (ano: number, mes: number, tasa: number, descripcion?: string) => void;
  obtenerTasaActivaParaCalculo: (ano: number, mes: number) => number;
  cargarHistorialTasas: () => void;
  getAuditoriaTasas: () => any[];
  updateParametros: (updates: Partial<Parametros>) => void;
  
  // Gestión de empleados
  addEmpleado: (empleado: Omit<Empleado, 'id'>) => void;
  updateEmpleado: (id: number, data: Partial<Empleado>) => void;
  deleteEmpleado: (id: number) => void;
  egressEmpleado: (id: number, fechaEgreso: string, causa: string) => void;
  
  // Gestión de empresas
  addEmpresa: (empresa: Omit<Empresa, 'id'>) => void;
  updateEmpresa: (id: number, data: Partial<Empresa>) => void;
  cambiarStatusEmpresa: (id: number, status: EmpresaStatus) => void;
  getEmpresaStatus: (id: number) => EmpresaStatus;
  puedeAccederANomina: (empresaId: number) => boolean;
  marcarExpedienteDescargado: (id: number) => void;
  
  // Batch processing (Lote de espera)
  loteEspera: LoteEspera[];
  asientosContables: AsientoContable[];
  ultimoAsiento: AsientoContable | null;
  addToLoteEspera: (item: LoteEspera) => void;
  updateInLoteEspera: (empleadoId: number, liquidacion: Liquidacion) => void;
  removeFromLoteEspera: (empleadoId: number) => void;
  generateBatchFromCompany: (empresaId: number, empleados: Empleado[], empresas: Empresa[], parametros: Parametros, tasaCambio: number) => void;
  clearLoteEspera: () => void;
  processLoteCompleto: (aportesEspeciales?: number) => { liquidaciones: Liquidacion[]; asiento: AsientoContable | null };
  
  // Conceptos patronales definibles
  conceptosPatronales: ConceptoPatronal[];
  addConceptoPatronal: (concepto: ConceptoPatronal) => void;
  updateConceptoPatronal: (id: string, data: Partial<ConceptoPatronal>) => void;
  deleteConceptoPatronal: (id: string) => void;
  
  // Utilidades
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Estado inicial
const initialParametros: Parametros = {
  ano: new Date().getFullYear(),
  mes: new Date().getMonth() + 1,
  salario_minimo: 130.00,
  tasa_cambio: 36.15,
  tasa_activa: 60.00,  // Tasa activa BCV para prestaciones sociales (default)
  umv: 3.42,
  tipo_moneda: 'USD',
  bono_transporte: 120.00,  // Bono transporte $120
  cesta_ticket: 40.00  // Cesta ticket $40
};

export const useAppStore = create<AppState>((set, get) => ({
  // Estado inicial
  usuario: null,
  isAuthenticated: false,
  empresas: [],
  empresasPermitidas: [],
  empresaSeleccionadaId: null,
  empleados: [],
  liquidaciones: [],
  parametros: initialParametros,
  currentView: 'dashboard',
  loading: false,
  error: null,
  successMessage: null,
  tasaCambio: 443.26,  // Tasa BCV actualizada al 13/03/2026
  tasaActiva: 60.00,
  historialTasasActivas: [],
  historialTasasCambio: [],
  auditoriaCambiosTasas: [],
  loteEspera: [],
  asientosContables: [],
  ultimoAsiento: null,
  conceptosPatronales: [],
  
  // Acciones
  setUsuario: (usuario) => set({ usuario, isAuthenticated: !!usuario }),
  setEmpresas: (empresas) => set({ empresas }),
  setEmpresasPermitidas: (empresasPermitidas) => set({ empresasPermitidas }),
  setEmpresaSeleccionada: (empresaSeleccionadaId) => set({ empresaSeleccionadaId }),
  
  // Obtener empresas filtradas según permisos
  getEmpresasfiltradas: () => {
    const { empresas, empresasPermitidas, usuario } = get();
    if (!usuario) return [];
    // ADMIN_MAESTRO puede ver todas
    if (usuario.rol === 'ADMIN_MAESTRO') return empresas;
    // Otros roles ven solo empresas permitidas
    return empresas.filter(e => empresasPermitidas.includes(e.id));
  },
  
  // Obtener empleados filtrados por empresa
  getEmpleadosFiltrados: () => {
    const { empleados, empresaSeleccionadaId, usuario } = get();
    if (!usuario) return [];
    // ADMIN_MAESTRO con empresa null puede ver todos
    if (usuario.rol === 'ADMIN_MAESTRO' && !empresaSeleccionadaId) return empleados;
    // Filtrar por empresa seleccionada
    if (empresaSeleccionadaId) {
      return empleados.filter(e => e.empresa_id === empresaSeleccionadaId);
    }
    return empleados;
  },
  
  // Verificar si puede gestionar una empresa
  puedeGestionarEmpresa: (empresaId: number) => {
    const { usuario, empresasPermitidas } = get();
    if (!usuario) return false;
    // ADMIN_MAESTRO puede gestionar todo
    if (usuario.rol === 'ADMIN_MAESTRO') return true;
    // Otros solo pueden gestionar empresas permitidas
    return empresasPermitidas.includes(empresaId);
  },
  
  // Verificar si puede ver todas las empresas
  puedeVerTodasEmpresas: () => {
    const { usuario } = get();
    return usuario?.rol === 'ADMIN_MAESTRO';
  },
  
  setEmpleados: (empleados) => set({ empleados }),
  setLiquidaciones: (liquidaciones) => set({ liquidaciones }),
  setParametros: (parametros) => set({ parametros }),
  setCurrentView: (currentView) => set({ currentView }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSuccessMessage: (successMessage) => set({ successMessage }),
  setTasaCambio: (tasaCambio) => set({ tasaCambio }),
  setTasaActiva: (tasaActiva) => set({ tasaActiva }),
  
  // Guardar tasa activa en historial
  guardarTasaActiva: (ano, mes, tasa, descripcion = 'Tasa Activa BCV') => {
    guardarTasaActivaBCV(ano, mes, tasa, descripcion);
    const historial = getHistorialTasasActivas();
    const auditoria = getAuditoriaCambiosTasas();
    set({ 
      tasaActiva: tasa,
      historialTasasActivas: historial,
      auditoriaCambiosTasas: auditoria
    });
    // Actualizar parámetros
    const { parametros } = get();
    set({ 
      parametros: { ...parametros, tasa_activa: tasa } 
    });
  },
  
  // Obtener tasa activa para cálculo de prestaciones (busca en historial)
  obtenerTasaActivaParaCalculo: (ano: number, mes: number) => {
    return getTasaActivaPorMes(ano, mes);
  },
  
  // Cargar historial de tasas
  cargarHistorialTasas: () => {
    const tasasActivas = getHistorialTasasActivas();
    const tasasCambio = getHistorialTasasCambio();
    const tasaActual = getUltimaTasaCambio();
    const auditoria = getAuditoriaCambiosTasas();
    
    set({ 
      historialTasasActivas: tasasActivas,
      historialTasasCambio: tasasCambio,
      tasaCambio: tasaActual,
      auditoriaCambiosTasas: auditoria
    });
  },
  getAuditoriaTasas: () => {
    return getAuditoriaCambiosTasas();
  },
  updateParametros: (updates) => set((state) => ({ 
    parametros: { ...state.parametros, ...updates } 
  })),
  // Login simulado (en producción usar API real)
  login: async (username, password) => {
    set({ loading: true, error: null });
    
    try {
      // Credenciales por defecto para demo
      if (username === 'admin' && password === 'Admin123!') {
        const usuario: Usuario = {
          id: 1,
          username: 'admin',
          nombre_completo: 'Administrador Maestro',
          rol: 'ADMIN_MAESTRO',
          empresa_id: 1,
          es_super_admin: true
        };
        
        // Datos de demo
        const empresas: Empresa[] = [
          { id: 1, rif: 'J-00000000-0', nombre: 'ADMINISTRACIÓN MAESTRA', lunes_mes: 4, es_inces_contribuyente: false, status: 'active' },
          { id: 2, rif: 'J-12345678-9', nombre: 'Corporación Ejemplo C.A.', lunes_mes: 4, es_inces_contribuyente: true, status: 'active' },
          { id: 3, rif: 'J-98765432-1', nombre: 'Inversiones X, C.A.', lunes_mes: 4, es_inces_contribuyente: true, status: 'active', 
            admin_master_email: 'admin@master.com', admin_master_telefono: '+58 412-1234567', admin_master_zelle: 'admin@zelle.com', admin_master_zinli: 'admin@zinli.com',
            admin_master_pago_movil: '0412-1234567', admin_master_banco: 'Banco de Venezuela', admin_master_cuenta: '0102-1234-5678-9012' },
          { id: 4, rif: 'J-55555555-5', nombre: 'Empresa Terminada C.A.', lunes_mes: 4, es_inces_contribuyente: true, status: 'terminated', 
            fecha_terminacion: '2024-12-31', expediente_descargado: false }
        ];
        
        // ADMIN_MAESTRO tiene acceso a todas las empresas
        const empresasPermitidas = empresas.map(e => e.id);
        
        const empleados: Empleado[] = [
          { id: 1, empresa_id: 2, cedula: 'V-12345678', nombre: 'Juan', apellido: 'Pérez', fecha_ingreso: '2020-01-15', sueldo_base: 500, tipo_moneda_sueldo: 'USD', estatus: 'ACTIVO', tipo_contrato: 'INDEFINIDO', tiene_hijos: true, cantidad_hijos: 2, cargo: 'Analista', departamento: 'Contabilidad' },
          { id: 2, empresa_id: 2, cedula: 'V-87654321', nombre: 'María', apellido: 'García', fecha_ingreso: '2021-06-01', sueldo_base: 450, tipo_moneda_sueldo: 'USD', estatus: 'ACTIVO', tipo_contrato: 'FIJO', tiene_hijos: false, cantidad_hijos: 0, cargo: 'Asistente', departamento: 'Administración' },
          { id: 3, empresa_id: 2, cedula: 'E-12345678', nombre: 'Carlos', apellido: 'López', fecha_ingreso: '2019-03-20', sueldo_base: 600, tipo_moneda_sueldo: 'USD', estatus: 'ACTIVO', tipo_contrato: 'INDEFINIDO', tiene_hijos: true, cantidad_hijos: 1, cargo: 'Gerente', departamento: 'Gerencia' },
          { id: 4, empresa_id: 3, cedula: 'V-11223344', nombre: 'Ana', apellido: 'Martínez', fecha_ingreso: '2022-01-10', sueldo_base: 350, tipo_moneda_sueldo: 'USD', estatus: 'ACTIVO', tipo_contrato: 'FIJO', tiene_hijos: false, cantidad_hijos: 0, cargo: 'Contador', departamento: 'Contabilidad' }
        ];
        
        set({
          usuario,
          empresas,
          empresasPermitidas,
          empresaSeleccionadaId: null, // ADMIN_MAESTRO puede ver todas
          empleados,
          isAuthenticated: true,
          loading: false
        });
        
        // Cargar historial de tasas BCV al iniciar
        get().cargarHistorialTasas();
        
        return true;
      }
      
      // Usuario demo: ADMIN_EMPRESA (solo puede ver una empresa)
      if (username === 'contador' && password === 'Contador123!') {
        const usuario: Usuario = {
          id: 2,
          username: 'contador',
          nombre_completo: 'Contador Empresa X',
          rol: 'ADMIN_EMPRESA',
          empresa_id: 3,
          empresas_permitidas: [3],
          es_super_admin: false
        };
        
        const empresas: Empresa[] = [
          { id: 1, rif: 'J-00000000-0', nombre: 'ADMINISTRACIÓN MAESTRA', lunes_mes: 4, es_inces_contribuyente: false, status: 'active' },
          { id: 2, rif: 'J-12345678-9', nombre: 'Corporación Ejemplo C.A.', lunes_mes: 4, es_inces_contribuyente: true, status: 'active' },
          { id: 3, rif: 'J-98765432-1', nombre: 'Inversiones X, C.A.', lunes_mes: 4, es_inces_contribuyente: true, status: 'active',
            admin_master_email: 'admin@master.com', admin_master_telefono: '+58 412-1234567', admin_master_zelle: 'admin@zelle.com', admin_master_zinli: 'admin@zinli.com',
            admin_master_pago_movil: '0412-1234567', admin_master_banco: 'Banco de Venezuela', admin_master_cuenta: '0102-1234-5678-9012' }
        ];
        
        // Solo puede ver la empresa 3
        const empresasPermitidas = [3];
        
        const empleados: Empleado[] = [
          { id: 1, empresa_id: 2, cedula: 'V-12345678', nombre: 'Juan', apellido: 'Pérez', fecha_ingreso: '2020-01-15', sueldo_base: 500, tipo_moneda_sueldo: 'USD', estatus: 'ACTIVO', tipo_contrato: 'INDEFINIDO', tiene_hijos: true, cantidad_hijos: 2, cargo: 'Analista', departamento: 'Contabilidad' },
          { id: 2, empresa_id: 2, cedula: 'V-87654321', nombre: 'María', apellido: 'García', fecha_ingreso: '2021-06-01', sueldo_base: 450, tipo_moneda_sueldo: 'USD', estatus: 'ACTIVO', tipo_contrato: 'FIJO', tiene_hijos: false, cantidad_hijos: 0, cargo: 'Asistente', departamento: 'Administración' },
          { id: 3, empresa_id: 2, cedula: 'E-12345678', nombre: 'Carlos', apellido: 'López', fecha_ingreso: '2019-03-20', sueldo_base: 600, tipo_moneda_sueldo: 'USD', estatus: 'ACTIVO', tipo_contrato: 'INDEFINIDO', tiene_hijos: true, cantidad_hijos: 1, cargo: 'Gerente', departamento: 'Gerencia' },
          { id: 4, empresa_id: 3, cedula: 'V-11223344', nombre: 'Ana', apellido: 'Martínez', fecha_ingreso: '2022-01-10', sueldo_base: 350, tipo_moneda_sueldo: 'USD', estatus: 'ACTIVO', tipo_contrato: 'FIJO', tiene_hijos: false, cantidad_hijos: 0, cargo: 'Contador', departamento: 'Contabilidad' }
        ];
        
        set({
          usuario,
          empresas,
          empresasPermitidas,
          empresaSeleccionadaId: 3, // Solo puede ver empresa 3
          empleados,
          isAuthenticated: true,
          loading: false
        });
        
        get().cargarHistorialTasas();
        
        return true;
      }
      
      set({ error: 'Credenciales incorrectas', loading: false });
      return false;
    } catch (error) {
      set({ error: 'Error al iniciar sesión', loading: false });
      return false;
    }
  },
  
  logout: () => {
    set({
      usuario: null,
      isAuthenticated: false,
      empresas: [],
      empresasPermitidas: [],
      empresaSeleccionadaId: null,
      empleados: [],
      liquidaciones: [],
      currentView: 'dashboard',
      loteEspera: []
    });
  },
  
  // Batch processing (Lote de espera)
  addToLoteEspera: (item) => {
    const { loteEspera } = get();
    // Verificar si el empleado ya está en el lote
    const exists = loteEspera.some(l => l.empleado_id === item.empleado_id);
    if (exists) {
      // Actualizar existente
      const updated = loteEspera.map(l => 
        l.empleado_id === item.empleado_id ? item : l
      );
      set({ loteEspera: updated });
    } else {
      // Agregar nuevo
      set({ loteEspera: [...loteEspera, item] });
    }
  },
  
  // Actualizar un empleado específico en el lote (para edición)
  updateInLoteEspera: (empleadoId, liquidacion) => {
    const { loteEspera, empleados } = get();
    const emp = empleados.find(e => e.id === empleadoId);
    if (!emp) return;
    
    const updated = loteEspera.map(l => 
      l.empleado_id === empleadoId 
        ? { ...l, liquidacion, fecha_agregado: new Date().toISOString() } 
        : l
    );
    set({ loteEspera: updated });
  },
  
  // Eliminar un empleado del lote
  removeFromLoteEspera: (empleadoId) => {
    const { loteEspera } = get();
    set({ loteEspera: loteEspera.filter(l => l.empleado_id !== empleadoId) });
  },
  
  // Generar lote completo desde empresa (procesamiento híbrido automático)
  // CORREGIDO: Fórmula correcta de Asignaciones = (Sueldo Base / 30 * Días) + Bono Vacacional + Utilidades + Asignaciones Manuales
  generateBatchFromCompany: (empresaId, empleados, empresas, parametros, tasaCambio) => {
    const empresa = empresas.find(e => e.id === empresaId);
    if (!empresa) return;
    
    const empleadosEmpresa = empleados.filter(e => 
      e.empresa_id === empresaId && e.estatus === 'ACTIVO'
    );
    
    if (empleadosEmpresa.length === 0) {
      set({ loteEspera: [] });
      return;
    }
    
    const hoy = new Date();
    const ano = hoy.getFullYear();
    const mes = hoy.getMonth() + 1;
    const lunes = empresa.lunes_mes || 4;
    const diasQuincena = 15;
    const diasMes = new Date(ano, mes, 0).getDate(); // Días totales del mes
    
    // ============================================================
    // REWRITE COMPLETO - LÓGICA DE NÓMINA v3
    // Reglas: SueldoQuincena = SueldoMensual / 2, BLOQUEO BCV para VES
    // ============================================================
    
    const lote: LoteEspera[] = empleadosEmpresa.map(emp => {
      // === VAR: SueldoMensual = Valor de 'Sueldo Base' en Módulo Personal ===
      const SueldoMensual = emp.sueldo_base;
      
      // === BLOQUEO BCV: Si Moneda == 'VES', Multiplicador = 1 ===
      // PROHIBIDO usar 36,15 para VES
      const esVES = emp.tipo_moneda_sueldo === 'VES';
      const MultiplicadorBCV = esVES ? 1 : tasaCambio; // VES = 1, USD = tasa
      const SueldoEnBs = SueldoMensual * MultiplicadorBCV;
      
      // === CALC: SueldoQuincena = SueldoMensual / 2 ===
      // Ejemplo: 130 / 2 = 65,00 Bs
      const SueldoQuincena = SueldoEnBs / 2;
      
      // === PRORRATEO POR FECHA DE INGRESO ===
      const fechaIngreso = new Date(emp.fecha_ingreso);
      const inicioMes = new Date(ano, mes - 1, 1);
      const finMes = new Date(ano, mes - 1, diasMes);
      
      let diasLaborados: number;
      if (fechaIngreso <= inicioMes) {
        diasLaborados = diasQuincena;
      } else if (fechaIngreso <= finMes) {
        const diasDesdeIngreso = Math.min(diasQuincena, Math.max(0, diasQuincena - (fechaIngreso.getDate() - 1)));
        diasLaborados = Math.max(0, diasDesdeIngreso);
      } else {
        diasLaborados = 0;
      }
      
      // Calcular antigüedad
      const anosAntiguedad = Math.floor((hoy.getTime() - fechaIngreso.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      
      // === SUELDO DEL PERÍODO (prorrateado) ===
      const SueldoPeriodo = Math.round((SueldoQuincena / diasQuincena) * diasLaborados * 100) / 100;
      
      // === BENEFICIOS INDIVIDUALES ===
      const tieneBonoVacacional = emp.pagar_bono_vacacional === true;
      const tieneUtilidades = emp.pagar_utilidades === true;
      
      let bonoVacacional = 0;
      if (tieneBonoVacacional && anosAntiguedad >= 1) {
        const mesesTrabajados = (ano - fechaIngreso.getFullYear()) * 12 + (mes - fechaIngreso.getMonth() - 1);
        const diasVacaciones = Math.max(0, Math.min(mesesTrabajados * 1.25, 15));
        const sueldoDiario = (SueldoEnBs * 12) / 360;
        bonoVacacional = Math.round(sueldoDiario * diasVacaciones * 100) / 100;
      }
      
      let utilidad = 0;
      if (tieneUtilidades) {
        utilidad = Math.round((SueldoPeriodo) * 0.15 * 100) / 100;
      }
      
      const bonoTransporte = 0;
      const cestaTicket = 0;
      
      // === TOTAL ASIGNACIONES ===
      const totalAsignaciones = Math.round((SueldoPeriodo + bonoVacacional + utilidad + bonoTransporte + cestaTicket) * 100) / 100;
      
      // === DEDUCCIONES ===
      // ============================================================
      // RECÁLCULO DE DEDUCCIONES DE LEY - Marzo 2026 (5 Lunes)
      // Fórmula actualizada según instrucciones específicas:
      // IVSS (4%): ((Sueldo Mensual * 12) / 52) * 0.04 * 5
      // RPE (0.5%): ((Sueldo Mensual * 12) / 52) * 0.005 * 5
      // FAOV (1%): Sueldo Quincenal * 0.01
      // ============================================================
      const semanal = (SueldoEnBs * 12) / 52;
      const topeSemanal = (parametros.salario_minimo * 5 * 12) / 52;
      const baseCalculo = Math.min(semanal, topeSemanal);
      
      // IVSS (4%): ((Sueldo Mensual * 12) / 52) * 0.04 * 5
      const ivss = Math.round((semanal * 0.04 * lunes) * 100) / 100;
      
      // RPE (0.5%): ((Sueldo Mensual * 12) / 52) * 0.005 * 5
      const rpe = Math.round((semanal * 0.005 * lunes) * 100) / 100;
      
      // FAOV (1%): Sueldo Quincenal * 0.01
      const faov = Math.round(SueldoQuincena * 0.01 * 100) / 100;
      
      const inces = empresa.es_inces_contribuyente && empleadosEmpresa.length >= 5 
        ? Math.round(semanal * 0.02 * lunes * 100) / 100 
        : 0;
      
      const totalDeducciones = Math.round((ivss + rpe + faov + inces) * 100) / 100;
      
      // === NETO A PAGAR ===
      const netoPagar = Math.round((totalAsignaciones - totalDeducciones) * 100) / 100;
      
      // === NETO USD (dividir neto Bs entre tasa BCV 443,26) ===
      const netoUsd = Math.round((netoPagar / tasaCambio) * 100) / 100;
      
      const liquidacion: Liquidacion = {
        empleado_id: emp.id,
        empresa_id: empresaId,
        periodo: `${ano}-${String(mes).padStart(2, '0')}-15`,
        ano,
        mes,
        quincena: 1,
        dias_trabajados: diasLaborados,
        lunes_periodo: lunes,
        // GUARDAR SUELDO QUINCENAL (período) - Ejemplo: 65,00 Bs
        sueldo_base: Math.round(SueldoPeriodo * 100) / 100,
        bono_vacacional: bonoVacacional,
        utilidades: utilidad,
        otras_asignaciones: bonoTransporte + cestaTicket,
        total_asignaciones: totalAsignaciones,
        ivss_trabajador: ivss,
        rpe_trabajador: rpe,
        faov_trabajador: faov,
        inces_trabajador: 0,
        inces_patronal: inces,
        otras_deducciones: 0,
        total_deducciones: totalDeducciones,
        neto_pagar: netoPagar,
        tipo_cambio_usd: tasaCambio,
        // El monto_bs es el neto en VES (sin conversión adicional)
        monto_bs: Math.round(netoPagar * 100) / 100,
        fecha_liquidacion: new Date().toISOString(),
        conceptos_asignaciones: [],
        conceptos_deducciones: []
      };
      
      return {
        empleado_id: emp.id,
        empleado_nombre: `${emp.nombre} ${emp.apellido || ''}`,
        empleado_cedula: emp.cedula,
        liquidacion,
        fecha_agregado: new Date().toISOString()
      };
    });
    
    set({ loteEspera: lote });
  },
  
  clearLoteEspera: () => {
    set({ loteEspera: [] });
  },
  
  processLoteCompleto: (aportesEspeciales = 0) => {
    const { loteEspera, parametros, tasaCambio, empresas, conceptosPatronales } = get();
    
    if (loteEspera.length === 0) {
      return { liquidaciones: [], asiento: null };
    }
    
    const liquidaciones = loteEspera.map(l => l.liquidacion);
    
    // Obtener la empresa del primer empleado
    const primeraLiquidacion = liquidaciones[0];
    const empresa = empresas.find(e => e.id === primeraLiquidacion.empresa_id);
    const nombreEmpresa = empresa?.nombre || 'Empresa Desconocida';
    
    // Calcular totales de nómina
    const totalSueldoBase = liquidaciones.reduce((sum, l) => sum + l.sueldo_base, 0);
    const totalNetoPagar = liquidaciones.reduce((sum, l) => sum + l.neto_pagar, 0);
    const totalIvssTrabajador = liquidaciones.reduce((sum, l) => sum + l.ivss_trabajador, 0);
    const totalFaovTrabajador = liquidaciones.reduce((sum, l) => sum + l.faov_trabajador, 0);
    const totalInces = liquidaciones.reduce((sum, l) => sum + (l.inces_trabajador || 0), 0);
    
    // Calcular provisiones laborales (Art. 142, Intereses, Utilidades, Bono Vacacional)
    const diasMes = 30;
    const diarioSueldo = totalSueldoBase / diasMes;
    const tasaActiva = parametros.tasa_activa / 100;
    
    // Garantía de Prestaciones (Art. 142a): 5 días por mes (15 días/trimestre)
    const garantiaPrestaciones = diarioSueldo * 5;
    
    // Intereses sobre Prestaciones (tasa activa BCV)
    const interesesPrestaciones = garantiaPrestaciones * tasaActiva / 12;
    
    // Alícuota de Utilidades (30 días al año = 2.5 días/mes)
    const aliCuotaUtilidades = diarioSueldo * 2.5;
    
    // Alícuota de Bono Vacacional (15 días al año = 1.25 días/mes)
    const aliCuotaBonoVacacional = diarioSueldo * 1.25;
    
    // Calcular aportes patronales
    const ivssPatronal = totalSueldoBase * 0.07; // 7% employer
    const faovPatronal = totalSueldoBase * 0.01; // 1% employer
    const spfPatronal = totalSueldoBase * 0.02; // 2% SPF (default)
    const incesPatronal = empresa?.es_inces_contribuyente && loteEspera.length >= 5 
      ? totalSueldoBase * 0.02 
      : 0; // 2% INCES
    
    // Total de aportes patronales (para el DEBE como gasto)
    const totalAportesPatronales = ivssPatronal + faovPatronal + spfPatronal + incesPatronal;
    
    // ============================================================
    // CALCULAR CONCEPTOS PATRONALES DEFINIBLES
    // Por cada concepto patronale verificamos si el empleado tiene
    // la deducción manual activada (trigger)
    // ============================================================
    const conceptosPatronalesActivos = conceptosPatronales.filter(cp => cp.activo);
    const conceptosPatronalesDetalle: {
      concepto_id: string;
      denominacion: string;
      cuenta_gasto: string;
      cuenta_pasivo: string;
      monto: number;
    }[] = [];
    
    // Inicializar totales por concepto
    const totalesPorConcepto: Record<string, number> = {};
    
    // Por cada concepto patronale definible
    conceptosPatronalesActivos.forEach(cp => {
      let totalMontoConcepto = 0;
      
      // Buscar empleados que tengan el trigger activo
      loteEspera.forEach(item => {
        const deducciones = item.liquidacion.conceptos_deducciones || [];
        const triggerActivo = deducciones.some(
          d => d.id === cp.concepto_trigger_id && d.activo && d.denominacion.trim() !== ''
        );
        
        if (triggerActivo) {
          // Calcular el monto del aporte patronale
          const monto = cp.tipo === 'MONTO_FIJO' 
            ? cp.valor 
            : item.liquidacion.sueldo_base * (cp.valor / 100);
          totalMontoConcepto += monto;
        }
      });
      
      if (totalMontoConcepto > 0) {
        conceptosPatronalesDetalle.push({
          concepto_id: cp.id,
          denominacion: cp.denominacion,
          cuenta_gasto: cp.cuenta_gasto,
          cuenta_pasivo: cp.cuenta_pasivo,
          monto: Math.round(totalMontoConcepto * 100) / 100
        });
        totalesPorConcepto[cp.id] = totalMontoConcepto;
      }
    });
    
    // Total de conceptos patronales definibles
    const totalPasivosPatronales = Object.values(totalesPorConcepto).reduce((sum, m) => sum + m, 0);
    
    // Generar el asiento contable
    // DEBE: Gastos (Sueldos + Aportes Patronales + Provisiones + Conceptos Patronales Definibles)
    // HABER: Acreedores (Neto a Pagar + Retenciones + Aportes Patronales por Pagar + Conceptos Patronales por Pagar)
    const asiento: AsientoContable = {
      id: `ASiento-${Date.now()}`,
      empresa_id: primeraLiquidacion.empresa_id,
      empresa_nombre: nombreEmpresa,
      periodo: primeraLiquidacion.periodo,
      ano: primeraLiquidacion.ano,
      mes: primeraLiquidacion.mes,
      quincena: primeraLiquidacion.quincena,
      fecha_generacion: new Date().toISOString(),
      // DEBE: Gastos = Sueldo Base + Aportes Patronales + Provisiones + Conceptos Patronales Definibles
      gasto_sueldos: totalSueldoBase,
      gasto_prestaciones: garantiaPrestaciones,
      gasto_intereses: interesesPrestaciones,
      gasto_utilidades: aliCuotaUtilidades,
      gasto_bono_vacacional: aliCuotaBonoVacacional,
      total_debe: totalSueldoBase + totalAportesPatronales + garantiaPrestaciones + interesesPrestaciones + aliCuotaUtilidades + aliCuotaBonoVacacional + totalPasivosPatronales,
      // HABER: Neto a Pagar + Retenciones (IVSS trab, FAOV trab) + Aportes Patronales por Pagar + Conceptos Patronales por Pagar
      // NOTA: RPE, INCES Trabajador NO van al recibo, solo al asiento
      neto_pagar_banco: totalNetoPagar,
      ivss_trabajador_por_pagar: totalIvssTrabajador,
      ivss_patronal_por_pagar: ivssPatronal,
      faov_trabajador_por_pagar: totalFaovTrabajador,
      faov_patronal_por_pagar: faovPatronal,
      spf_por_pagar: spfPatronal,
      inces_por_pagar: incesPatronal,
      aportes_especiales_por_pagar: aportesEspeciales,
      total_haber: totalNetoPagar + totalIvssTrabajador + totalFaovTrabajador + ivssPatronal + faovPatronal + spfPatronal + incesPatronal + aportesEspeciales + totalPasivosPatronales,
      // Conceptos patronales definibles
      conceptos_patronales_detalle: conceptosPatronalesDetalle,
      total_pasivos_patronales: totalPasivosPatronales,
      // Detalle por empleado
      empleados: loteEspera.map(l => ({
        empleado_id: l.empleado_id,
        nombre: l.empleado_nombre,
        cedula: l.empleado_cedula,
        sueldo_base: l.liquidacion.sueldo_base,
        neto_pagar: l.liquidacion.neto_pagar
      }))
    };
    
    // Guardar el asiento contable
    const { asientosContables } = get();
    set({ 
      loteEspera: [],
      liquidaciones: [...get().liquidaciones, ...liquidaciones],
      asientosContables: [...asientosContables, asiento],
      ultimoAsiento: asiento
    });
    
    return { liquidaciones, asiento };
  },
  
  // Gestión de Conceptos Patronales Definibles
  addConceptoPatronal: (concepto) => {
    const { conceptosPatronales } = get();
    set({ conceptosPatronales: [...conceptosPatronales, concepto] });
  },
  
  updateConceptoPatronal: (id, data) => {
    const { conceptosPatronales } = get();
    const nuevosConceptos = conceptosPatronales.map(c => 
      c.id === id ? { ...c, ...data } : c
    );
    set({ conceptosPatronales: nuevosConceptos });
  },
  
  deleteConceptoPatronal: (id) => {
    const { conceptosPatronales } = get();
    set({ conceptosPatronales: conceptosPatronales.filter(c => c.id !== id) });
  },
  
  // Gestión de empleados
  addEmpleado: (empleado) => {
    const { empleados } = get();
    const maxId = Math.max(...empleados.map(e => e.id), 0);
    const nuevoEmpleado: Empleado = {
      ...empleado,
      id: maxId + 1
    };
    set({ empleados: [...empleados, nuevoEmpleado] });
  },
  
  // Gestión de empresas
  addEmpresa: (empresa) => {
    const { empresas } = get();
    const maxId = Math.max(...empresas.map(e => e.id), 0);
    const nuevaEmpresa: Empresa = {
      ...empresa,
      id: maxId + 1
    };
    set({ empresas: [...empresas, nuevaEmpresa] });
  },
  
  updateEmpresa: (id, data) => {
    const { empresas } = get();
    const nuevasEmpresas = empresas.map(e => 
      e.id === id ? { ...e, ...data } : e
    );
    set({ empresas: nuevasEmpresas });
  },
  
  cambiarStatusEmpresa: (id: number, status: EmpresaStatus) => {
    const { empresas } = get();
    const nuevasEmpresas = empresas.map(e => {
      if (e.id === id) {
        return { 
          ...e, 
          status,
          fecha_terminacion: status === 'terminated' ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return e;
    });
    set({ empresas: nuevasEmpresas });
  },
  
  getEmpresaStatus: (id: number): EmpresaStatus => {
    const { empresas } = get();
    const empresa = empresas.find(e => e.id === id);
    return empresa?.status || 'active';
  },
  
  puedeAccederANomina: (empresaId: number): boolean => {
    const status = get().getEmpresaStatus(empresaId);
    // Solo puede acceder si está active o si es ADMIN_MAESTRO
    const { usuario } = get();
    if (usuario?.rol === 'ADMIN_MAESTRO') return true;
    return status === 'active';
  },
  
  marcarExpedienteDescargado: (id: number) => {
    const { empresas } = get();
    const nuevasEmpresas = empresas.map(e => 
      e.id === id ? { ...e, expediente_descargado: true } : e
    );
    set({ empresas: nuevasEmpresas });
  },
  
  updateEmpleado: (id, data) => {
    const { empleados } = get();
    const nuevosEmpleados = empleados.map(e => 
      e.id === id ? { ...e, ...data } : e
    );
    set({ empleados: nuevosEmpleados });
  },
  
  deleteEmpleado: (id) => {
    const { empleados } = get();
    set({ empleados: empleados.filter(e => e.id !== id) });
  },
  
  egressEmpleado: (id, fechaEgreso, causa) => {
    const { empleados } = get();
    const nuevosEmpleados = empleados.map(e => 
      e.id === id 
        ? { ...e, estatus: 'EGRESADO' as const, fecha_egreso: fechaEgreso } 
        : e
    );
    set({ empleados: nuevosEmpleados });
  }
}));

export default useAppStore;
