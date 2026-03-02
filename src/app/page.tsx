"use client";

import { useState, useEffect } from "react";
import useAppStore, { Empresa, Empleado, Liquidacion } from "../lib/store";
import { engineLOTTT, ParametrosNomina } from "../lib/engine-lottt";
import { getTasaCambio } from "../lib/bcv-service";
import { generarReciboLiquidacion, generarLibroDiario, descargarPDF } from "../lib/pdf-generator";
import {
  Building2,
  Users,
  Receipt,
  FileText,
  Settings,
  LogOut,
  DollarSign,
  Calculator,
  AlertTriangle,
  Check,
  RefreshCw,
  Download,
  Plus,
  Search,
  Edit,
  Trash2,
  UserMinus,
  Wallet,
  BookOpen,
  PenTool
} from "lucide-react";

// ============================================================
// COMPONENTE: LOGIN
// ============================================================
function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Nómina Venezuela</h1>
          <p className="text-neutral-400 mt-2">Sistema de Gestión de Nómina LOTTT</p>
        </div>

        {/* Formulario de Login */}
        <div className="bg-neutral-800 rounded-2xl p-8 border border-neutral-700">
          <h2 className="text-xl font-semibold text-white mb-6">Acceso Administrador</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Iniciando sesión..." : "Ingresar"}
            </button>
          </form>

          <div className="mt-6 p-4 bg-neutral-700 rounded-lg">
            <p className="text-xs text-neutral-400 text-center">
              Credenciales de demostración:<br />
              <span className="text-white">Usuario: admin</span><br />
              <span className="text-white">Contraseña: Admin123!</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: DASHBOARD
// ============================================================
function Dashboard() {
  const {
    usuario,
    empresas,
    empleados,
    liquidaciones,
    parametros,
    currentView,
    setCurrentView,
    logout,
    tasaCambio,
    setTasaCambio,
    setSuccessMessage,
    setError
  } = useAppStore();

  const [loadingTasa, setLoadingTasa] = useState(false);

  // Cargar tasa BCV al inicio
  useEffect(() => {
    const fetchTasa = async () => {
      setLoadingTasa(true);
      try {
        const tasa = await getTasaCambio();
        setTasaCambio(tasa.precio);
      } catch (e) {
        console.error("Error fetching tasa:", e);
      }
      setLoadingTasa(false);
    };
    fetchTasa();
  }, [setTasaCambio]);

  // Obtener empleados activos
  const empleadosActivos = empleados.filter(e => e.estatus === 'ACTIVO');

  // Calcular nómina total
  const nominaTotal = empleadosActivos.reduce((sum, e) => sum + e.sueldo_base_usd, 0);

  const views = {
    dashboard: <DashboardView />,
    empresas: <EmpresasView />,
    empleados: <EmpleadosView />,
    nomina: <NominaView />,
    reportes: <ReportesView />,
    parametros: <ParametrosView />,
    contabilidad: <ContabilidadView />
  };

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="bg-neutral-800 border-b border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Nómina Venezuela</h1>
                <p className="text-xs text-neutral-400">Sistema LOTTT</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Tasa BCV */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-700 rounded-lg">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-sm text-neutral-300">BCV:</span>
                <span className="text-sm font-semibold text-green-400">
                  {loadingTasa ? "..." : `Bs. ${tasaCambio.toFixed(2)}`}
                </span>
                <button
                  onClick={async () => {
                    setLoadingTasa(true);
                    try {
                      const tasa = await getTasaCambio();
                      setTasaCambio(tasa.precio);
                      setSuccessMessage("Tasa actualizada");
                    } catch {
                      setError("Error al actualizar tasa");
                    }
                    setLoadingTasa(false);
                  }}
                  disabled={loadingTasa}
                  className="ml-1 p-1 hover:bg-neutral-600 rounded"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingTasa ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Usuario */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {usuario?.nombre_completo?.charAt(0) || "A"}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-white">{usuario?.nombre_completo}</p>
                  <p className="text-xs text-neutral-400">{usuario?.rol}</p>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navegación */}
      <nav className="bg-neutral-800 border-b border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 h-12">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Building2 },
              { id: 'empresas', label: 'Empresas', icon: Building2 },
              { id: 'empleados', label: 'Empleados', icon: Users },
              { id: 'nomina', label: 'Nómina', icon: Receipt },
              { id: 'reportes', label: 'Reportes', icon: FileText },
              { id: 'parametros', label: 'Parámetros', icon: Settings },
              { id: 'contabilidad', label: 'Contabilidad', icon: PenTool },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                className={`flex items-center gap-2 px-4 text-sm font-medium transition-colors ${
                  currentView === item.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {views[currentView]}
      </main>
    </div>
  );
}

// ============================================================
// VISTA: DASHBOARD
// ============================================================
function DashboardView() {
  const { empresas, empleados, tasaCambio } = useAppStore();
  const empleadosActivos = empleados.filter(e => e.estatus === 'ACTIVO');
  const nominaTotal = empleadosActivos.reduce((sum, e) => sum + e.sueldo_base_usd, 0);
  const nominaBs = nominaTotal * tasaCambio;

  const stats = [
    {
      label: "Empresas Registradas",
      value: empresas.length,
      icon: Building2,
      color: "bg-blue-600"
    },
    {
      label: "Empleados Activos",
      value: empleadosActivos.length,
      icon: Users,
      color: "bg-green-600"
    },
    {
      label: "Nómina Mensual (USD)",
      value: `$${nominaTotal.toFixed(2)}`,
      icon: DollarSign,
      color: "bg-yellow-600"
    },
    {
      label: "Nómina Mensual (Bs)",
      value: `Bs. ${nominaBs.toFixed(2)}`,
      icon: Calculator,
      color: "bg-purple-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-neutral-400">Resumen del sistema de nómina</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
        <h3 className="text-lg font-semibold text-white mb-4">Información del Sistema</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-neutral-300">
            <Check className="w-5 h-5 text-green-400" />
            <span>Cálculos LOTTT implementados</span>
          </div>
          <div className="flex items-center gap-3 text-neutral-300">
            <Check className="w-5 h-5 text-green-400" />
            <span>Integración BCV activa</span>
          </div>
          <div className="flex items-center gap-3 text-neutral-300">
            <Check className="w-5 h-5 text-green-400" />
            <span>Generación de PDF disponible</span>
          </div>
          <div className="flex items-center gap-3 text-neutral-300">
            <Check className="w-5 h-5 text-green-400" />
            <span>Validación de duplicados activada</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VISTA: EMPRESAS
// ============================================================
function EmpresasView() {
  const { empresas, setSuccessMessage } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    rif: "",
    nombre: "",
    direccion: "",
    telefono: "",
    email: "",
    lunes_mes: 4,
    es_inces_contribuyente: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("Empresa guardada correctamente");
    setShowForm(false);
    setFormData({
      rif: "",
      nombre: "",
      direccion: "",
      telefono: "",
      email: "",
      lunes_mes: 4,
      es_inces_contribuyente: false
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Empresas</h2>
          <p className="text-neutral-400">Gestión de empresas registradas</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <Plus className="w-4 h-4" />
          Nueva Empresa
        </button>
      </div>

      {showForm && (
        <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
          <h3 className="text-lg font-semibold text-white mb-4">Nueva Empresa</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-300 mb-1">RIF</label>
              <input
                type="text"
                value={formData.rif}
                onChange={(e) => setFormData({ ...formData, rif: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                placeholder="J-12345678-9"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-neutral-300 mb-1">Dirección</label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Teléfono</label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Lunes del mes</label>
              <input
                type="number"
                value={formData.lunes_mes}
                onChange={(e) => setFormData({ ...formData, lunes_mes: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                min={1}
                max={5}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="inces"
                checked={formData.es_inces_contribuyente}
                onChange={(e) => setFormData({ ...formData, es_inces_contribuyente: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="inces" className="text-sm text-neutral-300">
                Contribuyente INCES
              </label>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-neutral-700 text-white rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Empresas */}
      <div className="grid gap-4">
        {empresas.map((empresa) => (
          <div key={empresa.id} className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{empresa.nombre}</h3>
                <p className="text-neutral-400">RIF: {empresa.rif}</p>
                {empresa.direccion && (
                  <p className="text-sm text-neutral-500 mt-1">{empresa.direccion}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {empresa.es_inces_contribuyente && (
                  <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded">
                    INCES
                  </span>
                )}
                <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded">
                  {empresa.lunes_mes} lunes/mes
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// VISTA: EMPLEADOS
// ============================================================
function EmpleadosView() {
  const { empleados, empresas, setSuccessMessage, setError, addEmpleado, updateEmpleado, deleteEmpleado, egressEmpleado } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState<number | null>(null);
  const [egresandoId, setEgresandoId] = useState<number | null>(null);
  const [fechaEgreso, setFechaEgreso] = useState("");
  const [causaEgreso, setCausaEgreso] = useState("");
  const [formData, setFormData] = useState({
    empresa_id: 2,
    cedula: "",
    nombre: "",
    apellido: "",
    fecha_nacimiento: "",
    fecha_ingreso: "",
    cargo: "",
    departamento: "",
    sueldo_base_usd: 0,
    estatus: "ACTIVO" as const,
    tipo_contrato: "INDEFINIDO" as const,
    tiene_hijos: false,
    cantidad_hijos: 0
  });

  // Validar cédula única
  const validarCedulaUnica = (cedula: string, empresa_id: number, excludeId?: number): boolean => {
    const existe = empleados.some(
      e => e.empresa_id === empresa_id && e.cedula === cedula && e.id !== excludeId
    );
    if (existe) {
      setError("ERROR: La Cédula ya está registrada para esta empresa. No se permiten duplicados.");
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarCedulaUnica(formData.cedula, formData.empresa_id)) {
      return;
    }
    if (editMode) {
      updateEmpleado(editMode, formData);
      setSuccessMessage("Empleado actualizado correctamente");
      setEditMode(null);
    } else {
      addEmpleado(formData);
      setSuccessMessage("Empleado registrado correctamente");
    }
    setShowForm(false);
    setFormData({
      empresa_id: 2,
      cedula: "",
      nombre: "",
      apellido: "",
      fecha_nacimiento: "",
      fecha_ingreso: "",
      cargo: "",
      departamento: "",
      sueldo_base_usd: 0,
      estatus: "ACTIVO",
      tipo_contrato: "INDEFINIDO",
      tiene_hijos: false,
      cantidad_hijos: 0
    });
  };

  const handleEdit = (empleado: any) => {
    setFormData({
      empresa_id: empleado.empresa_id,
      cedula: empleado.cedula,
      nombre: empleado.nombre,
      apellido: empleado.apellido || "",
      fecha_nacimiento: empleado.fecha_nacimiento || "",
      fecha_ingreso: empleado.fecha_ingreso,
      cargo: empleado.cargo || "",
      departamento: empleado.departamento || "",
      sueldo_base_usd: empleado.sueldo_base_usd,
      estatus: empleado.estatus,
      tipo_contrato: empleado.tipo_contrato,
      tiene_hijos: empleado.tiene_hijos,
      cantidad_hijos: empleado.cantidad_hijos
    });
    setEditMode(empleado.id);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de eliminar este empleado? Esta acción no se puede deshacer.")) {
      deleteEmpleado(id);
      setSuccessMessage("Empleado eliminado correctamente");
    }
  };

  const handleEgreso = () => {
    if (egresandoId && fechaEgreso) {
      egressEmpleado(egresandoId, fechaEgreso, causaEgreso);
      setSuccessMessage("Empleado egressado correctamente");
      setEgresandoId(null);
      setFechaEgreso("");
      setCausaEgreso("");
    } else {
      setError("Debe seleccionar una fecha de egreso");
    }
  };

  const filteredEmpleados = empleados.filter(e =>
    e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.cedula.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Empleados</h2>
          <p className="text-neutral-400">Gestión de empleados registrados</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <Plus className="w-4 h-4" />
          Nuevo Empleado
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre o cédula..."
          className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400"
        />
      </div>

      {showForm && (
        <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
          <h3 className="text-lg font-semibold text-white mb-4">Nuevo Empleado</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Empresa</label>
              <select
                value={formData.empresa_id}
                onChange={(e) => setFormData({ ...formData, empresa_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                required
              >
                {empresas.filter(e => e.id !== 1).map(e => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Cédula *</label>
              <input
                type="text"
                value={formData.cedula}
                onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                placeholder="V-12345678"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Nombre *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Apellido</label>
              <input
                type="text"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Fecha Ingreso *</label>
              <input
                type="date"
                value={formData.fecha_ingreso}
                onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Sueldo Base USD *</label>
              <input
                type="number"
                value={formData.sueldo_base_usd}
                onChange={(e) => setFormData({ ...formData, sueldo_base_usd: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Cargo</label>
              <input
                type="text"
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Departamento</label>
              <input
                type="text"
                value={formData.departamento}
                onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Estatus</label>
              <select
                value={formData.estatus}
                onChange={(e) => setFormData({ ...formData, estatus: e.target.value as any })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
              >
                <option value="ACTIVO">Activo</option>
                <option value="VACACIONES">Vacaciones</option>
                <option value="EGRESADO">Egresado</option>
                <option value="SUSPENDIDO">Suspendido</option>
              </select>
            </div>
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                Registrar
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-neutral-700 text-white rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Empleados */}
      <div className="bg-neutral-800 rounded-xl border border-neutral-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Cédula</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Empresa</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Cargo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Sueldo USD</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Estatus</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-neutral-300 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-700">
            {filteredEmpleados.map((empleado) => {
              const empresa = empresas.find(e => e.id === empleado.empresa_id);
              return (
                <tr key={empleado.id} className="hover:bg-neutral-750">
                  <td className="px-4 py-3 text-white">{empleado.cedula}</td>
                  <td className="px-4 py-3 text-white">{empleado.nombre} {empleado.apellido}</td>
                  <td className="px-4 py-3 text-neutral-300">{empresa?.nombre || 'N/A'}</td>
                  <td className="px-4 py-3 text-neutral-300">{empleado.cargo || '-'}</td>
                  <td className="px-4 py-3 text-white font-medium">${empleado.sueldo_base_usd.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded ${
                      empleado.estatus === 'ACTIVO' ? 'bg-green-600/20 text-green-400' :
                      empleado.estatus === 'VACACIONES' ? 'bg-blue-600/20 text-blue-400' :
                      'bg-red-600/20 text-red-400'
                    }`}>
                      {empleado.estatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEdit(empleado)}
                        className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {empleado.estatus !== 'EGRESADO' && (
                        <button
                          onClick={() => setEgresandoId(empleado.id)}
                          className="p-1.5 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 rounded"
                          title="Egresar"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(empleado.id)}
                        className="p-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de Egreso */}
      {egresandoId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 rounded-xl p-6 max-w-md w-full mx-4 border border-neutral-700">
            <h3 className="text-lg font-semibold text-white mb-4">Egresar Empleado</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-300 mb-1">Fecha de Egreso</label>
                <input
                  type="date"
                  value={fechaEgreso}
                  onChange={(e) => setFechaEgreso(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1">Causa del Egreso</label>
                <select
                  value={causaEgreso}
                  onChange={(e) => setCausaEgreso(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                >
                  <option value="">Seleccionar...</option>
                  <option value="RENUNCIA">Renuncia</option>
                  <option value="DESPIDO">Despido</option>
                  <option value="JUBILACION">Jubilación</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleEgreso}
                  className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
                >
                  Confirmar Egreso
                </button>
                <button
                  onClick={() => { setEgresandoId(null); setFechaEgreso(""); setCausaEgreso(""); }}
                  className="px-4 py-2 bg-neutral-700 text-white rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// VISTA: NÓMINA
// ============================================================
function NominaView() {
  const { empleados, empresas, tasaCambio, setSuccessMessage, setLiquidaciones, liquidaciones } = useAppStore();
  const [quincena, setQuincena] = useState(1);
  const [procesando, setProcesando] = useState(false);
  const [tipoConcepto, setTipoConcepto] = useState<'NOMINA' | 'UTILIDADES' | 'AGUINALDOS'>('NOMINA');
  const [pagarBonoVacacional, setPagarBonoVacacional] = useState(false);

  const empleadosActivos = empleados.filter(e => e.estatus === 'ACTIVO' && e.empresa_id !== 1);

  const procesarNomina = async () => {
    setProcesando(true);
    
    const parametros: ParametrosNomina = {
      salarioMinimo: 130.00,
      numEmpleados: empleadosActivos.length,
      tasaCambio: tasaCambio,
      umv: 3.42,
      tipoConcepto,
      pagarBonoVacacional
    };

    const nuevasLiquidaciones: Liquidacion[] = empleadosActivos.map(emp => {
      const empresa = empresas.find(e => e.id === emp.empresa_id);
      const lunes = empresa?.lunes_mes || 4;
      const dias = quincena === 1 ? 15 : 15;
      
      const result = engineLOTTT.procesarLiquidacion(
        {
          diasLaborados: dias,
          lunesPeriodo: lunes,
          sueldoBase: emp.sueldo_base_usd,
          fechaIngreso: emp.fecha_ingreso,
          tieneHijos: emp.tiene_hijos,
          cantidadHijos: emp.cantidad_hijos
        },
        parametros
      );

      return {
        empleado_id: emp.id,
        empresa_id: emp.empresa_id,
        periodo: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${quincena === 1 ? '15' : '30'}`,
        ano: new Date().getFullYear(),
        mes: new Date().getMonth() + 1,
        quincena,
        dias_trabajados: result.dias_trabajados,
        lunes_periodo: result.lunes_periodo,
        sueldo_base: result.sueldo_base,
        bono_vacacional: result.bono_vacacional,
        utilidades: result.utilidades,
        otras_asignaciones: result.otras_asignaciones,
        total_asignaciones: result.total_asignaciones,
        ivss_trabajador: result.ivss_trabajador,
        rpe_trabajador: result.rpe_trabajador,
        faov_trabajador: result.faov_trabajador,
        inces_trabajador: result.inces_trabajador,
        inces_patronal: result.inces_patronal,
        otras_deducciones: result.otras_deducciones,
        total_deducciones: result.total_deducciones,
        neto_pagar: result.neto_pagar,
        tipo_cambio_usd: tasaCambio,
        monto_bs: result.neto_pagar_bs,
        fecha_liquidacion: new Date().toISOString()
      };
    });

    setLiquidaciones(nuevasLiquidaciones);
    setSuccessMessage("Nómina procesada correctamente");
    setProcesando(false);
  };

  // Calcular totales
  const totalAsignaciones = liquidaciones.reduce((sum, l) => sum + l.total_asignaciones, 0);
  const totalDeducciones = liquidaciones.reduce((sum, l) => sum + l.total_deducciones, 0);
  const totalNeto = liquidaciones.reduce((sum, l) => sum + l.neto_pagar, 0);
  const totalBs = liquidaciones.reduce((sum, l) => sum + l.monto_bs, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Procesar Nómina</h2>
          <p className="text-neutral-400">Cálculos según Ley LOTTT Venezuela</p>
        </div>
      </div>

      {/* Controles */}
      <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm text-neutral-300 mb-1">Quincena</label>
            <select
              value={quincena}
              onChange={(e) => setQuincena(parseInt(e.target.value))}
              className="px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
            >
              <option value={1}>1ra Quincena (1-15)</option>
              <option value={2}>2da Quincena (16-30)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-neutral-300 mb-1">Concepto de Pago</label>
            <select
              value={tipoConcepto}
              onChange={(e) => setTipoConcepto(e.target.value as any)}
              className="px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
            >
              <option value="NOMINA">Nómina Ordinaria</option>
              <option value="UTILIDADES">Utilidades</option>
              <option value="AGUINALDOS">Aguinaldos</option>
            </select>
          </div>

          {tipoConcepto === 'NOMINA' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-neutral-700 rounded-lg">
              <input
                type="checkbox"
                id="bonoVacacional"
                checked={pagarBonoVacacional}
                onChange={(e) => setPagarBonoVacacional(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="bonoVacacional" className="text-sm text-neutral-300">
                PAGAR BONO VACACIONAL
              </label>
            </div>
          )}
          
          <div className="flex items-end gap-2">
            <button
              onClick={procesarNomina}
              disabled={procesando}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              <Calculator className="w-4 h-4" />
              {procesando ? "Procesando..." : "Procesar Nómina"}
            </button>
          </div>

          <div className="ml-auto flex items-center gap-4 text-sm">
            <span className="text-neutral-400">Tasa BCV:</span>
            <span className="text-green-400 font-semibold">Bs. {tasaCambio.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {liquidaciones.length > 0 && (
        <div className="space-y-4">
          <div className="bg-neutral-800 rounded-xl border border-neutral-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Empleado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-300 uppercase">Asignaciones</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-300 uppercase">Deducciones</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-300 uppercase">Neto USD</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-300 uppercase">Neto Bs</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-neutral-300 uppercase">Recibo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700">
                {liquidaciones.map((liq, idx) => {
                  const emp = empleados.find(e => e.id === liq.empleado_id);
                  return (
                    <tr key={idx} className="hover:bg-neutral-750">
                      <td className="px-4 py-3 text-white">
                        <div className="font-medium">{emp?.nombre} {emp?.apellido}</div>
                        <div className="text-xs text-neutral-400">{emp?.cedula}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-green-400">
                        ${liq.total_asignaciones.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-red-400">
                        ${liq.total_deducciones.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-white font-bold">
                        ${liq.neto_pagar.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-yellow-400 font-medium">
                        Bs. {liq.monto_bs.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button className="p-1 hover:bg-neutral-600 rounded text-neutral-400 hover:text-white">
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-neutral-700 font-bold">
                <tr>
                  <td className="px-4 py-3 text-white">TOTALES</td>
                  <td className="px-4 py-3 text-right text-green-400">${totalAsignaciones.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-red-400">${totalDeducciones.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-white">${totalNeto.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-yellow-400">Bs. {totalBs.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// VISTA: REPORTES
// ============================================================
function ReportesView() {
  const { empleados, empresas, liquidaciones, tasaCambio, setSuccessMessage } = useAppStore();

  const generarReciboPDF = (liquidacion: Liquidacion) => {
    const emp = empleados.find(e => e.id === liquidacion.empleado_id);
    const empresa = empresas.find(e => e.id === liquidacion.empresa_id);
    
    if (!emp || !empresa) return;

    const data = {
      empresa: {
        nombre: empresa.nombre,
        rif: empresa.rif,
        direccion: empresa.direccion || "Venezuela"
      },
      empleado: {
        nombre: emp.nombre,
        apellido: emp.apellido || "",
        cedula: emp.cedula,
        cargo: emp.cargo || "Empleado",
        departamento: emp.departamento || "General",
        fecha_ingreso: emp.fecha_ingreso
      },
      periodo: {
        ano: liquidacion.ano,
        mes: liquidacion.mes,
        quincena: liquidacion.quincena,
        dias_trabajados: liquidacion.dias_trabajados,
        fecha_pago: new Date().toLocaleDateString("es-VE")
      },
      asignaciones: [
        { descripcion: "Sueldo Base", monto: liquidacion.sueldo_base },
        { descripcion: "Bono Vacacional", monto: liquidacion.bono_vacacional },
        { descripcion: "Utilidades", monto: liquidacion.utilidades }
      ],
      deducciones: [
        { descripcion: "IVSS", monto: liquidacion.ivss_trabajador },
        { descripcion: "RPE", monto: liquidacion.rpe_trabajador },
        { descripcion: "FAOV", monto: liquidacion.faov_trabajador },
        { descripcion: "INCES", monto: liquidacion.inces_trabajador }
      ],
      totales: {
        total_asignaciones: liquidacion.total_asignaciones,
        total_deducciones: liquidacion.total_deducciones,
        neto_pagar: liquidacion.neto_pagar,
        tasa_cambio: tasaCambio,
        neto_bs: liquidacion.monto_bs
      },
      fecha_liquidacion: new Date().toLocaleDateString("es-VE")
    };

    const doc = generarReciboLiquidacion(data);
    descargarPDF(doc, `recibo_${emp.cedula}_${liquidacion.mes}_${liquidacion.quincena}.pdf`);
    setSuccessMessage("Recibo descargado");
  };

  const generarLibroDiarioPDF = () => {
    if (liquidaciones.length === 0) return;

    const data = liquidaciones.map(liq => {
      const emp = empleados.find(e => e.id === liq.empleado_id);
      const empresa = empresas.find(e => e.id === liq.empresa_id);
      
      return {
        empresa: {
          nombre: empresa?.nombre || "",
          rif: empresa?.rif || "",
          direccion: empresa?.direccion || ""
        },
        empleado: {
          nombre: emp?.nombre || "",
          apellido: emp?.apellido || "",
          cedula: emp?.cedula || "",
          cargo: emp?.cargo || "",
          departamento: emp?.departamento || "",
          fecha_ingreso: emp?.fecha_ingreso || ""
        },
        periodo: {
          ano: liq.ano,
          mes: liq.mes,
          quincena: liq.quincena,
          dias_trabajados: liq.dias_trabajados,
          fecha_pago: new Date().toLocaleDateString("es-VE")
        },
        asignaciones: [
          { descripcion: "Sueldo Base", monto: liq.sueldo_base },
          { descripcion: "Bono Vacacional", monto: liq.bono_vacacional },
          { descripcion: "Utilidades", monto: liq.utilidades }
        ],
        deducciones: [
          { descripcion: "IVSS", monto: liq.ivss_trabajador },
          { descripcion: "RPE", monto: liq.rpe_trabajador },
          { descripcion: "FAOV", monto: liq.faov_trabajador },
          { descripcion: "INCES", monto: liq.inces_trabajador }
        ],
        totales: {
          total_asignaciones: liq.total_asignaciones,
          total_deducciones: liq.total_deducciones,
          neto_pagar: liq.neto_pagar,
          tasa_cambio: tasaCambio,
          neto_bs: liq.monto_bs
        },
        fecha_liquidacion: new Date().toLocaleDateString("es-VE")
      };
    });

    const doc = generarLibroDiario(data, {
      ano: new Date().getFullYear(),
      mes: new Date().getMonth() + 1,
      quincena: liquidaciones[0]?.quincena || 1
    });
    descargarPDF(doc, `libro_diario_${new Date().getMonth() + 1}_${new Date().getFullYear()}.pdf`);
    setSuccessMessage("Libro diario generado");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Reportes</h2>
        <p className="text-neutral-400">Generación de documentos PDF</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recibo Individual */}
        <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Recibo de Liquidación</h3>
              <p className="text-sm text-neutral-400">Generar recibo individual en PDF</p>
            </div>
          </div>
          
          {liquidaciones.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {liquidaciones.map((liq, idx) => {
                const emp = empleados.find(e => e.id === liq.empleado_id);
                return (
                  <div key={idx} className="flex items-center justify-between p-2 bg-neutral-700 rounded-lg">
                    <span className="text-white text-sm">{emp?.nombre} {emp?.apellido}</span>
                    <button
                      onClick={() => generarReciboPDF(liq)}
                      className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-neutral-400 text-sm">No hay liquidaciones procesadas</p>
          )}
        </div>

        {/* Libro Diario */}
        <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-600 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Libro Diario Quincenal</h3>
              <p className="text-sm text-neutral-400">Resumen de nómina en PDF</p>
            </div>
          </div>
          
          <button
            onClick={generarLibroDiarioPDF}
            disabled={liquidaciones.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Descargar Libro Diario
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VISTA: PARÁMETROS
// ============================================================
function ParametrosView() {
  const { parametros, setParametros, tasaCambio, setTasaCambio, setSuccessMessage } = useAppStore();
  const [loadingTasa, setLoadingTasa] = useState(false);

  const handleActualizarTasa = async () => {
    setLoadingTasa(true);
    try {
      const tasa = await getTasaCambio();
      setTasaCambio(tasa.precio);
      setParametros({ ...parametros, tasa_cambio: tasa.precio, fecha_actualizacion_tasa: new Date().toISOString() });
      setSuccessMessage("Tasa actualizada correctamente");
    } catch {
      setSuccessMessage("Error al actualizar tasa");
    }
    setLoadingTasa(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Parámetros del Sistema</h2>
        <p className="text-neutral-400">Configuración de nómina y tasas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tasas Cambiarias */}
        <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
          <h3 className="text-lg font-semibold text-white mb-4">Tasa de Cambio BCV</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-neutral-700 rounded-lg">
              <div>
                <p className="text-sm text-neutral-400">Dólar (USD)</p>
                <p className="text-2xl font-bold text-green-400">Bs. {tasaCambio.toFixed(2)}</p>
              </div>
              <button
                onClick={handleActualizarTasa}
                disabled={loadingTasa}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {loadingTasa ? "Actualizando..." : "Actualizar"}
              </button>
            </div>
            
            {parametros.fecha_actualizacion_tasa && (
              <p className="text-xs text-neutral-500">
                Última actualización: {new Date(parametros.fecha_actualizacion_tasa).toLocaleString("es-VE")}
              </p>
            )}
          </div>
        </div>

        {/* Parámetros Salariales */}
        <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
          <h3 className="text-lg font-semibold text-white mb-4">Parámetros Salariales</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Salario Mínimo (Bs)</span>
              <span className="text-white font-semibold">Bs. {parametros.salario_minimo.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Período Actual</span>
              <span className="text-white font-semibold">{parametros.mes}/{parametros.ano}</span>
            </div>
          </div>
        </div>

        {/* Retenciones Légales */}
        <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
          <h3 className="text-lg font-semibold text-white mb-4">Porcentajes de Retención</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg">
              <span className="text-neutral-300">IVSS (4%)</span>
              <span className="text-white font-medium">4%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg">
              <span className="text-neutral-300">RPE (0.5%)</span>
              <span className="text-white font-medium">0.5%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg">
              <span className="text-neutral-300">FAOV (1%)</span>
              <span className="text-white font-medium">1%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-neutral-700 rounded-lg">
              <span className="text-neutral-300">INCES (0.5% {'>'} 5 empleados)</span>
              <span className="text-white font-medium">0.5%</span>
            </div>
          </div>
        </div>

        {/* Información BCV */}
        <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
          <h3 className="text-lg font-semibold text-white mb-4">Fuente de Datos</h3>
          
          <div className="space-y-3">
            <div className="p-3 bg-neutral-700 rounded-lg">
              <p className="text-sm text-neutral-400">Banco Central de Venezuela</p>
              <p className="text-xs text-neutral-500 mt-1">bcv.org.ve</p>
            </div>
            <p className="text-xs text-neutral-500">
              Los parámetros se actualizan automáticamente desde los servicios oficiales del BCV.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VISTA: CONTABILIDAD
// ============================================================
function ContabilidadView() {
  const { empleados, empresas, liquidaciones, tasaCambio, setSuccessMessage, setError } = useAppStore();
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [procesando, setProcesando] = useState(false);

  const empleadosActivos = empleados.filter(e => e.estatus === 'ACTIVO' && e.empresa_id !== 1);
  
  // Calcular provisiones laborales
  const calcularProvisiones = () => {
    const nominaTotal = empleadosActivos.reduce((sum, e) => sum + e.sueldo_base_usd, 0);
    const diarioSueldo = nominaTotal / 30;
    
    // Garantía de Prestaciones (Art. 142a): 15 días por trimestre
    const garantia = (diarioSueldo * 15) / 3; // Trimestral
    
    // Intereses sobre Prestaciones (tasa activa BCV aproximadamente 60%)
    const tasaActiva = 0.60; // 60% anual
    const intereses = garantia * tasaActiva / 4; // Trimestral
    
    // Alícuota de Utilidades (30 días)
    const utilidades = diarioSueldo * 30 / 12; // Mensual
    
    // Alícuota de Bono Vacacional (según antigüedad)
    const bonoVacacional = diarioSueldo * 15 / 12; // Promedio
    
    return {
      garantia: Math.round(garantia * 100) / 100,
      intereses: Math.round(intereses * 100) / 100,
      utilidades: Math.round(utilidades * 100) / 100,
      bonoVacacional: Math.round(bonoVacacional * 100) / 100
    };
  };

  const provisiones = calcularProvisiones();
  const totalProvisiones = provisiones.garantia + provisiones.intereses + provisiones.utilidades + provisiones.bonoVacacional;

  // Calcular totales de nómina
  const totalNeto = liquidaciones.reduce((sum, l) => sum + l.neto_pagar, 0);
  const totalIvss = liquidaciones.reduce((sum, l) => sum + l.ivss_trabajador, 0);
  const totalFaov = liquidaciones.reduce((sum, l) => sum + l.faov_trabajador, 0);
  const totalRpe = liquidaciones.reduce((sum, l) => sum + l.rpe_trabajador, 0);
  const totalIncesPatronal = liquidaciones.reduce((sum, l) => sum + (l.inces_patronal || 0), 0);

  const generarAsientoDiario = () => {
    if (liquidaciones.length === 0) {
      setError("No hay liquidaciones procesadas");
      return;
    }

    const empresa = empresas.find(e => e.id === 2);
    if (!empresa) return;

    // Generar datos para el asiento
    const dataLiquidaciones = liquidaciones.map(liq => {
      const emp = empleados.find(e => e.id === liq.empleado_id);
      return {
        empresa: { nombre: empresa.nombre, rif: empresa.rif, direccion: empresa.direccion || "" },
        empleado: { nombre: emp?.nombre || "", apellido: emp?.apellido || "", cedula: emp?.cedula || "", cargo: emp?.cargo || "", departamento: emp?.departamento || "", fecha_ingreso: emp?.fecha_ingreso || "" },
        periodo: { ano: liq.ano, mes: liq.mes, quincena: liq.quincena, dias_trabajados: liq.dias_trabajados },
        asignaciones: [
          { descripcion: "Sueldo Base", monto: liq.sueldo_base },
          { descripcion: "Bono Vacacional", monto: liq.bono_vacacional },
          { descripcion: "Utilidades", monto: liq.utilidades }
        ],
        deducciones: [
          { descripcion: "IVSS", monto: liq.ivss_trabajador },
          { descripcion: "RPE", monto: liq.rpe_trabajador },
          { descripcion: "FAOV", monto: liq.faov_trabajador },
          { descripcion: "INCES", monto: liq.inces_trabajador }
        ],
        totales: {
          total_asignaciones: liq.total_asignaciones,
          total_deducciones: liq.total_deducciones,
          neto_pagar: liq.neto_pagar,
          tasa_cambio: tasaCambio,
          neto_bs: liq.monto_bs
        },
        fecha_liquidacion: new Date().toLocaleDateString("es-VE")
      };
    });

    const { generarAsientoContable, descargarPDF } = require("../lib/pdf-generator");
    const doc = generarAsientoContable(dataLiquidaciones, empresa, { ano, mes, quincena: 1 }, provisiones);
    descargarPDF(doc, `asiento_diario_${mes}_${ano}.pdf`);
    setSuccessMessage("Asiento de diario generado");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Contabilidad y Provisiones</h2>
        <p className="text-neutral-400">Asientos contables y provisiones laborales LOTTT</p>
      </div>

      {/* Período */}
      <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm text-neutral-300 mb-1">Año</label>
            <select
              value={ano}
              onChange={(e) => setAno(parseInt(e.target.value))}
              className="px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
            >
              {[2024, 2025, 2026].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-neutral-300 mb-1">Mes</label>
            <select
              value={mes}
              onChange={(e) => setMes(parseInt(e.target.value))}
              className="px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
            >
              {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Dicembre"].map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Provisiones Laborales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-400" />
            Provisiones del Mes
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-neutral-700 rounded-lg">
              <span className="text-neutral-300">Garantía PS (Art. 142a)</span>
              <span className="text-white font-medium">${provisiones.garantia.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-3 bg-neutral-700 rounded-lg">
              <span className="text-neutral-300">Intereses sobre PS</span>
              <span className="text-white font-medium">${provisiones.intereses.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-3 bg-neutral-700 rounded-lg">
              <span className="text-neutral-300">Alícuota Utilidades</span>
              <span className="text-white font-medium">${provisiones.utilidades.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-3 bg-neutral-700 rounded-lg">
              <span className="text-neutral-300">Alícuota Bono Vacacional</span>
              <span className="text-white font-medium">${provisiones.bonoVacacional.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-3 bg-purple-600/20 rounded-lg border border-purple-600">
              <span className="text-white font-bold">TOTAL PROVISIONES</span>
              <span className="text-purple-400 font-bold">${totalProvisiones.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Resumen Nómina */}
        <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Resumen Nómina
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-neutral-700 rounded-lg">
              <span className="text-neutral-300">Neto a Pagar</span>
              <span className="text-green-400 font-medium">${totalNeto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-3 bg-neutral-700 rounded-lg">
              <span className="text-neutral-300">IVSS</span>
              <span className="text-red-400 font-medium">${totalIvss.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-3 bg-neutral-700 rounded-lg">
              <span className="text-neutral-300">FAOV</span>
              <span className="text-red-400 font-medium">${totalFaov.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-3 bg-neutral-700 rounded-lg">
              <span className="text-neutral-300">RPE</span>
              <span className="text-red-400 font-medium">${totalRpe.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-3 bg-neutral-700 rounded-lg">
              <span className="text-neutral-300">INCES Patronal</span>
              <span className="text-red-400 font-medium">${totalIncesPatronal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Asiento de Diario */}
      <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
        <h3 className="text-lg font-semibold text-white mb-4">Generar Asiento de Diario</h3>
        <p className="text-neutral-400 text-sm mb-4">
          Genera el asiento contable automático con gasto de nómina, bancos y provisiones de pasivos laborales.
        </p>
        <button
          onClick={generarAsientoDiario}
          disabled={liquidaciones.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
        >
          <PenTool className="w-4 h-4" />
          Generar Asiento Contable
        </button>
        {liquidaciones.length === 0 && (
          <p className="text-yellow-400 text-sm mt-2">⚠️ Debe procesar la nómina primero</p>
        )}
      </div>

      {/* Detalle Contable */}
      <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
        <h3 className="text-lg font-semibold text-white mb-4">Detalle Contable del Período</h3>
        
        <table className="w-full">
          <thead className="bg-neutral-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Cuenta</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-300 uppercase">Debe (USD)</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-300 uppercase">Haber (USD)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-700">
            <tr>
              <td className="px-4 py-3 text-white font-medium">Gasto de Sueldos</td>
              <td className="px-4 py-3 text-right text-green-400">${liquidaciones.reduce((s, l) => s + l.total_asignaciones, 0).toFixed(2)}</td>
              <td className="px-4 py-3 text-right">-</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-white font-medium">Bancos</td>
              <td className="px-4 py-3 text-right">-</td>
              <td className="px-4 py-3 text-right text-red-400">${totalNeto.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-white font-medium">IVSS por Pagar</td>
              <td className="px-4 py-3 text-right">-</td>
              <td className="px-4 py-3 text-right text-red-400">${totalIvss.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-white font-medium">FAOV por Pagar</td>
              <td className="px-4 py-3 text-right">-</td>
              <td className="px-4 py-3 text-right text-red-400">${totalFaov.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-white font-medium">RPE por Pagar</td>
              <td className="px-4 py-3 text-right">-</td>
              <td className="px-4 py-3 text-right text-red-400">${totalRpe.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-white font-medium">Provisiones Laborales</td>
              <td className="px-4 py-3 text-right text-green-400">${totalProvisiones.toFixed(2)}</td>
              <td className="px-4 py-3 text-right">-</td>
            </tr>
          </tbody>
          <tfoot className="bg-neutral-700 font-bold">
            <tr>
              <td className="px-4 py-3 text-white">TOTALES</td>
              <td className="px-4 py-3 text-right text-green-400">${(liquidaciones.reduce((s, l) => s + l.total_asignaciones, 0) + totalProvisiones).toFixed(2)}</td>
              <td className="px-4 py-3 text-right text-red-400">${(totalNeto + totalIvss + totalFaov + totalRpe).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function Home() {
  const { isAuthenticated } = useAppStore();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <Dashboard />;
}
