// ============================================================
// GESTIÓN DE ESTADO - Zustand Store
// ============================================================

import { create } from 'zustand';

// Tipos
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
}

export interface Usuario {
  id: number;
  username: string;
  nombre_completo: string;
  rol: 'ADMIN_MAESTRO' | 'ADMIN_EMPRESA' | 'OPERADOR';
  empresa_id?: number;
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
  sueldo_base_usd: number;
  estatus: 'ACTIVO' | 'VACACIONES' | 'EGRESADO' | 'SUSPENDIDO';
  tipo_contrato: 'FIJO' | 'INDEFINIDO' | 'TEMPORAL';
  tiene_hijos: boolean;
  cantidad_hijos: number;
}

export interface Parametros {
  ano: number;
  mes: number;
  salario_minimo: number;
  tasa_cambio: number;
  tasa_activa: number;  // Tasa activa BCV para prestaciones sociales
  umv: number;
  fecha_actualizacion_tasa?: string;
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
}

interface AppState {
  // Autenticación
  usuario: Usuario | null;
  isAuthenticated: boolean;
  
  // Datos
  empresas: Empresa[];
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
  
  // Acciones
  setUsuario: (usuario: Usuario | null) => void;
  setEmpresas: (empresas: Empresa[]) => void;
  setEmpleados: (empleados: Empleado[]) => void;
  setLiquidaciones: (liquidaciones: Liquidacion[]) => void;
  setParametros: (parametros: Parametros) => void;
  setCurrentView: (view: AppState['currentView']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  setTasaCambio: (tasa: number) => void;
  setTasaActiva: (tasa: number) => void;
  
  // Gestión de empleados
  addEmpleado: (empleado: Omit<Empleado, 'id'>) => void;
  updateEmpleado: (id: number, data: Partial<Empleado>) => void;
  deleteEmpleado: (id: number) => void;
  egressEmpleado: (id: number, fechaEgreso: string, causa: string) => void;
  
  // Gestión de empresas
  addEmpresa: (empresa: Omit<Empresa, 'id'>) => void;
  updateEmpresa: (id: number, data: Partial<Empresa>) => void;
  
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
  umv: 3.42
};

export const useAppStore = create<AppState>((set, get) => ({
  // Estado inicial
  usuario: null,
  isAuthenticated: false,
  empresas: [],
  empleados: [],
  liquidaciones: [],
  parametros: initialParametros,
  currentView: 'dashboard',
  loading: false,
  error: null,
  successMessage: null,
  tasaCambio: 36.15,
  tasaActiva: 60.00,
  
  // Acciones
  setUsuario: (usuario) => set({ usuario, isAuthenticated: !!usuario }),
  setEmpresas: (empresas) => set({ empresas }),
  setEmpleados: (empleados) => set({ empleados }),
  setLiquidaciones: (liquidaciones) => set({ liquidaciones }),
  setParametros: (parametros) => set({ parametros }),
  setCurrentView: (currentView) => set({ currentView }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSuccessMessage: (successMessage) => set({ successMessage }),
  setTasaCambio: (tasaCambio) => set({ tasaCambio }),
  setTasaActiva: (tasaActiva) => set({ tasaActiva }),
  
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
          empresa_id: 1
        };
        
        // Datos de demo
        const empresas: Empresa[] = [
          { id: 1, rif: 'J-00000000-0', nombre: 'ADMINISTRACIÓN MAESTRA', lunes_mes: 4, es_inces_contribuyente: false },
          { id: 2, rif: 'J-12345678-9', nombre: 'Corporación Ejemplo C.A.', lunes_mes: 4, es_inces_contribuyente: true }
        ];
        
        const empleados: Empleado[] = [
          { id: 1, empresa_id: 2, cedula: 'V-12345678', nombre: 'Juan', apellido: 'Pérez', fecha_ingreso: '2020-01-15', sueldo_base_usd: 500, estatus: 'ACTIVO', tipo_contrato: 'INDEFINIDO', tiene_hijos: true, cantidad_hijos: 2, cargo: 'Analista', departamento: 'Contabilidad' },
          { id: 2, empresa_id: 2, cedula: 'V-87654321', nombre: 'María', apellido: 'García', fecha_ingreso: '2021-06-01', sueldo_base_usd: 450, estatus: 'ACTIVO', tipo_contrato: 'FIJO', tiene_hijos: false, cantidad_hijos: 0, cargo: 'Asistente', departamento: 'Administración' },
          { id: 3, empresa_id: 2, cedula: 'E-12345678', nombre: 'Carlos', apellido: 'López', fecha_ingreso: '2019-03-20', sueldo_base_usd: 600, estatus: 'ACTIVO', tipo_contrato: 'INDEFINIDO', tiene_hijos: true, cantidad_hijos: 1, cargo: 'Gerente', departamento: 'Gerencia' }
        ];
        
        set({
          usuario,
          empresas,
          empleados,
          isAuthenticated: true,
          loading: false
        });
        
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
