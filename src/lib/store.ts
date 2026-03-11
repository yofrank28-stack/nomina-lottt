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
  // Bonificaciones especiales
  bono_transporte?: number;
  cesta_ticket?: number;
  // Conceptos manuales (persistencia en histórico)
  conceptos_asignaciones?: ConceptoManual[];
  conceptos_deducciones?: ConceptoManual[];
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
  tasaCambio: 36.15,
  tasaActiva: 60.00,
  historialTasasActivas: [],
  historialTasasCambio: [],
  auditoriaCambiosTasas: [],
  
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
      currentView: 'dashboard'
    });
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
