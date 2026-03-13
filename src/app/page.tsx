"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useAppStore, { Empresa, Empleado, Liquidacion, ConceptoManual, LoteEspera } from "../lib/store";
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
  PenTool,
  Save,
  X,
  ArrowRightLeft,
  CheckSquare
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
  const router = useRouter();
  const {
    usuario,
    empresas,
    empleados,
    empresasPermitidas,
    empresaSeleccionadaId,
    setEmpresaSeleccionada,
    liquidaciones,
    parametros,
    currentView,
    setCurrentView,
    logout,
    tasaCambio,
    setTasaCambio,
    tasaActiva,
    setTasaActiva,
    setSuccessMessage,
    setError,
    puedeVerTodasEmpresas,
    getEmpresaStatus,
    updateEmpleado
  } = useAppStore();

  const [loadingTasa, setLoadingTasa] = useState(false);
  const [mostrarEnBsGlobal, setMostrarEnBsGlobal] = useState(true);

  // Verificar status de empresa al cambiar selección
  useEffect(() => {
    if (empresaSeleccionadaId && usuario?.rol !== 'ADMIN_MAESTRO') {
      const status = getEmpresaStatus(empresaSeleccionadaId);
      if (status === 'suspended' || status === 'terminated') {
        router.push(`/service-suspended?empresa=${empresaSeleccionadaId}`);
      }
    }
  }, [empresaSeleccionadaId, usuario, getEmpresaStatus, router]);

  // Verificar acceso al cambiar de vista
  const handleViewChange = (view: string) => {
    if (empresaSeleccionadaId && usuario?.rol !== 'ADMIN_MAESTRO') {
      const status = getEmpresaStatus(empresaSeleccionadaId);
      if (status === 'suspended' || status === 'terminated') {
        // Solo permitir vistas limitadas
        const allowedViews = ['dashboard'];
        if (!allowedViews.includes(view)) {
          setSuccessMessage('Su servicio está suspendido. Contacte al administrador.');
          return;
        }
      }
    }
    setCurrentView(view as any);
  };

  // Obtener empresas permitidas para el selector
  const empresasParaSelector = puedeVerTodasEmpresas() 
    ? empresas 
    : empresas.filter(e => empresasPermitidas.includes(e.id));

  // Filtrar empleados según empresa seleccionada
  const empleadosFiltrados = empresaSeleccionadaId
    ? empleados.filter(e => e.empresa_id === empresaSeleccionadaId)
    : empleados;

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
  const empleadosActivos = empleadosFiltrados.filter(e => e.estatus === 'ACTIVO');

  // Calcular nómina total
  const nominaTotal = empleadosActivos.reduce((sum, e) => { const monto = e.tipo_moneda_sueldo === "USD" ? e.sueldo_base : e.sueldo_base / tasaCambio; return sum + monto; }, 0);
  const nominaBs = nominaTotal;

  const views = {
    dashboard: <DashboardView empresaId={empresaSeleccionadaId} />,
    empresas: puedeVerTodasEmpresas() ? <EmpresasView /> : <DashboardView empresaId={empresaSeleccionadaId} />,
    empleados: <EmpleadosView mostrarEnBs={mostrarEnBsGlobal} empresaId={empresaSeleccionadaId} />,
    nomina: <NominaView empresaId={empresaSeleccionadaId} />,
    reportes: <ReportesView empresaId={empresaSeleccionadaId} />,
    parametros: <ParametrosView />,
    contabilidad: <ContabilidadView empresaId={empresaSeleccionadaId} />
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
              {/* Selector de Moneda Global */}
              <div className="flex items-center gap-1 bg-neutral-700 rounded-lg p-0.5">
                <button
                  onClick={() => setMostrarEnBsGlobal(false)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    !mostrarEnBsGlobal 
                      ? 'bg-blue-600 text-white' 
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  USD
                </button>
                <button
                  onClick={() => setMostrarEnBsGlobal(true)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    mostrarEnBsGlobal 
                      ? 'bg-green-600 text-white' 
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  BS
                </button>
              </div>

              {/* Selector de Empresa */}
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-neutral-400" />
                <select
                  value={empresaSeleccionadaId || ''}
                  onChange={(e) => setEmpresaSeleccionada(e.target.value ? Number(e.target.value) : null)}
                  className={`bg-neutral-700 text-white text-sm rounded-lg px-3 py-1.5 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !puedeVerTodasEmpresas() ? 'cursor-not-allowed opacity-75' : ''
                  }`}
                  disabled={!puedeVerTodasEmpresas()}
                >
                  {puedeVerTodasEmpresas() && (
                    <option value="">Todas las Empresas</option>
                  )}
                  {empresasParaSelector.map(empresa => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nombre}
                    </option>
                  ))}
                </select>
              </div>

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

              {/* Tasa Activa BCV */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-700 rounded-lg">
                <span className="text-sm text-neutral-300">Tasa Activa:</span>
                <span className="text-sm font-semibold text-yellow-400">
                  {tasaActiva.toFixed(2)}%
                </span>
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
              ...(puedeVerTodasEmpresas() ? [{ id: 'empresas', label: 'Empresas', icon: Building2 }] : []),
              { id: 'empleados', label: 'Personal', icon: Users },
              { id: 'nomina', label: 'Nómina', icon: Receipt },
              { id: 'reportes', label: 'Reportes', icon: FileText },
              { id: 'parametros', label: 'Parámetros', icon: Settings },
              { id: 'contabilidad', label: 'Contabilidad', icon: PenTool },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id)}
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
function DashboardView({ empresaId }: { empresaId?: number | null }) {
  const { empresas, empleados, tasaCambio, puedeVerTodasEmpresas } = useAppStore();
  const [mostrarEnBs, setMostrarEnBs] = useState(true);
  
  // Filtrar empleados por empresa si está seleccionada
  const empleadosFiltrados = empresaId 
    ? empleados.filter(e => e.empresa_id === empresaId) 
    : empleados;
  
  const empleadosActivos = empleadosFiltrados.filter(e => e.estatus === 'ACTIVO');
  
  // Calcular nómina mensual en USD y BS
  const nominaEnUsd = empleadosActivos.reduce((sum, e) => { 
    const monto = e.tipo_moneda_sueldo === "USD" ? e.sueldo_base : e.sueldo_base / tasaCambio; 
    return sum + monto; 
  }, 0);
  const nominaEnBs = nominaEnUsd * tasaCambio;

  // Obtener empresas para mostrar
  const empresasFiltradas = puedeVerTodasEmpresas() && !empresaId 
    ? empresas 
    : empresas.filter(e => e.id === empresaId);

  const stats = [
    {
      label: "Empresas",
      value: empresasFiltradas.length,
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
      label: mostrarEnBs ? "Nómina Mensual (Bs)" : "Nómina Mensual (USD)",
      value: mostrarEnBs ? `Bs. ${nominaEnBs.toFixed(2)}` : `${nominaEnUsd.toFixed(2)}`,
      icon: DollarSign,
      color: "bg-yellow-600"
    },
    {
      label: "Tasa BCV",
      value: `Bs. ${tasaCambio.toFixed(2)}`,
      icon: Calculator,
      color: "bg-purple-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-neutral-400">Resumen del sistema de nómina</p>
        </div>
        
        {/* Selector de Moneda */}
        <div className="flex items-center gap-2 bg-neutral-800 rounded-lg p-1 border border-neutral-700">
          <button
            onClick={() => setMostrarEnBs(false)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              !mostrarEnBs 
                ? 'bg-blue-600 text-white' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            USD
          </button>
          <button
            onClick={() => setMostrarEnBs(true)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mostrarEnBs 
                ? 'bg-green-600 text-white' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            BS
          </button>
        </div>
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
  const { empresas, setSuccessMessage, addEmpresa, updateEmpresa, cambiarStatusEmpresa, puedeVerTodasEmpresas, usuario } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    rif: "",
    nombre: "",
    direccion: "",
    telefono: "",
    email: "",
    lunes_mes: 4,
    es_inces_contribuyente: false,
    // Datos de contacto para pagos
    admin_master_email: "",
    admin_master_telefono: "",
    admin_master_zelle: "",
    admin_master_zinli: "",
    admin_master_pago_movil: "",
    admin_master_banco: "",
    admin_master_cuenta: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editMode) {
      updateEmpresa(editMode, formData);
      setSuccessMessage("Empresa actualizada correctamente");
      setEditMode(null);
    } else {
      addEmpresa(formData as any);
      setSuccessMessage("Empresa creada correctamente");
    }
    setShowForm(false);
    setFormData({
      rif: "",
      nombre: "",
      direccion: "",
      telefono: "",
      email: "",
      lunes_mes: 4,
      es_inces_contribuyente: false,
      admin_master_email: "",
      admin_master_telefono: "",
      admin_master_zelle: "",
      admin_master_zinli: "",
      admin_master_pago_movil: "",
      admin_master_banco: "",
      admin_master_cuenta: ""
    });
  };

  const handleEdit = (empresa: any) => {
    setFormData({
      rif: empresa.rif,
      nombre: empresa.nombre,
      direccion: empresa.direccion || "",
      telefono: empresa.telefono || "",
      email: empresa.email || "",
      lunes_mes: empresa.lunes_mes,
      es_inces_contribuyente: empresa.es_inces_contribuyente,
      admin_master_email: empresa.admin_master_email || "",
      admin_master_telefono: empresa.admin_master_telefono || "",
      admin_master_zelle: empresa.admin_master_zelle || "",
      admin_master_zinli: empresa.admin_master_zinli || "",
      admin_master_pago_movil: empresa.admin_master_pago_movil || "",
      admin_master_banco: empresa.admin_master_banco || "",
      admin_master_cuenta: empresa.admin_master_cuenta || ""
    });
    setEditMode(empresa.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditMode(null);
    setFormData({
      rif: "",
      nombre: "",
      direccion: "",
      telefono: "",
      email: "",
      lunes_mes: 4,
      es_inces_contribuyente: false,
      admin_master_email: "",
      admin_master_telefono: "",
      admin_master_zelle: "",
      admin_master_zinli: "",
      admin_master_pago_movil: "",
      admin_master_banco: "",
      admin_master_cuenta: ""
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
          <h3 className="text-lg font-semibold text-white mb-4">
            {editMode ? 'Editar Empresa' : 'Nueva Empresa'}
          </h3>
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
            
            {/* Datos de Contacto para Pagos */}
            <div className="md:col-span-2 mt-4">
              <h4 className="text-md font-semibold text-white mb-3">Datos de Contacto para Pagos</h4>
            </div>
            
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Email Admin Master</label>
              <input
                type="email"
                value={formData.admin_master_email}
                onChange={(e) => setFormData({ ...formData, admin_master_email: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                placeholder="admin@ejemplo.com"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Teléfono Admin Master</label>
              <input
                type="text"
                value={formData.admin_master_telefono}
                onChange={(e) => setFormData({ ...formData, admin_master_telefono: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                placeholder="+58 412-1234567"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Zinli</label>
              <input
                type="text"
                value={formData.admin_master_zinli}
                onChange={(e) => setFormData({ ...formData, admin_master_zinli: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                placeholder="admin@zinli.com"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Zelle</label>
              <input
                type="text"
                value={formData.admin_master_zelle}
                onChange={(e) => setFormData({ ...formData, admin_master_zelle: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                placeholder="admin@zelle.com"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Pago Móvil</label>
              <input
                type="text"
                value={formData.admin_master_pago_movil}
                onChange={(e) => setFormData({ ...formData, admin_master_pago_movil: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                placeholder="0412-1234567"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Banco</label>
              <input
                type="text"
                value={formData.admin_master_banco}
                onChange={(e) => setFormData({ ...formData, admin_master_banco: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                placeholder="Banco de Venezuela"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Número de Cuenta</label>
              <input
                type="text"
                value={formData.admin_master_cuenta}
                onChange={(e) => setFormData({ ...formData, admin_master_cuenta: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                placeholder="0102-1234-5678-9012"
              />
            </div>
            
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
                <Save className="w-4 h-4" />
                {editMode ? 'Guardar Cambios' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-neutral-700 text-white rounded-lg flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Empresas */}
      <div className="grid gap-4">
        {empresas.map((empresa) => (
          <div key={empresa.id} className={`bg-neutral-800 rounded-xl p-6 border ${
            empresa.status === 'suspended' ? 'border-red-900/50' : 
            empresa.status === 'terminated' ? 'border-gray-700' : 'border-neutral-700'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">{empresa.nombre}</h3>
                  {/* Status Badge */}
                  {empresa.status === 'active' && (
                    <span className="px-2 py-0.5 bg-green-600/20 text-green-400 text-xs rounded-full">
                      Activo
                    </span>
                  )}
                  {empresa.status === 'suspended' && (
                    <span className="px-2 py-0.5 bg-red-600/20 text-red-400 text-xs rounded-full">
                      Suspendido
                    </span>
                  )}
                  {empresa.status === 'terminated' && (
                    <span className="px-2 py-0.5 bg-gray-600/20 text-gray-400 text-xs rounded-full">
                      Terminado
                    </span>
                  )}
                </div>
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
                {empresa.id !== 1 && (
                  <button
                    onClick={() => handleEdit(empresa)}
                    className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded ml-2"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Botones de Estado para ADMIN_MAESTRO */}
            {usuario?.rol === 'ADMIN_MAESTRO' && empresa.id !== 1 && (
              <div className="mt-4 pt-4 border-t border-neutral-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-neutral-400">
                    Control de Servicio:
                  </div>
                  <div className="flex gap-2">
                    {/* Botón Activar */}
                    {empresa.status !== 'active' && (
                      <button
                        onClick={() => {
                          cambiarStatusEmpresa(empresa.id, 'active');
                          setSuccessMessage(`Empresa ${empresa.nombre} activada`);
                        }}
                        className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg text-sm flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Activar
                      </button>
                    )}
                    {/* Botón Suspender */}
                    {empresa.status !== 'suspended' && empresa.status !== 'terminated' && (
                      <button
                        onClick={() => {
                          cambiarStatusEmpresa(empresa.id, 'suspended');
                          setSuccessMessage(`Empresa ${empresa.nombre} suspendida`);
                        }}
                        className="px-3 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 rounded-lg text-sm flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        Suspender
                      </button>
                    )}
                    {/* Botón Terminar */}
                    {empresa.status !== 'terminated' && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Está seguro de TERMINAR ${empresa.nombre}? Esta acción es irreversible y generará el expediente final.`)) {
                            cambiarStatusEmpresa(empresa.id, 'terminated');
                            setSuccessMessage(`Empresa ${empresa.nombre} terminada. Puede descargar el expediente final.`);
                          }
                        }}
                        className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-sm flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Terminar
                      </button>
                    )}
                    {/* Indicador de expediente descargado */}
                    {empresa.status === 'terminated' && empresa.expediente_descargado && (
                      <span className="px-3 py-1.5 bg-gray-600/20 text-gray-400 rounded-lg text-sm flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Expediente Descargado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// VISTA: EMPLEADOS
// ============================================================
function EmpleadosView({ mostrarEnBs, empresaId }: { mostrarEnBs: boolean; empresaId?: number | null }) {
  const { empleados, empresas, tasaCambio, setSuccessMessage, setError, addEmpleado, updateEmpleado, deleteEmpleado, egressEmpleado, empresasPermitidas, puedeVerTodasEmpresas } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState<number | null>(null);
  const [egresandoId, setEgresandoId] = useState<number | null>(null);
  const [transferirId, setTransferirId] = useState<number | null>(null);
  const [empresaOrigenTransfer, setEmpresaOrigenTransfer] = useState<number | null>(null);
  const [empresaDestinoTransfer, setEmpresaDestinoTransfer] = useState<number | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<number | 'all'>(empresaId || 'all');
  const [fechaEgreso, setFechaEgreso] = useState("");
  const [causaEgreso, setCausaEgreso] = useState("");
  
  // Filtrar empresas según permisos
  const empresasPermitidasList = puedeVerTodasEmpresas() 
    ? empresas 
    : empresas.filter(e => empresasPermitidas.includes(e.id));
  
  // Inicializar empresa_id por defecto
  const empresaDefault = empresaId || (empresasPermitidasList.length > 0 ? empresasPermitidasList[0].id : 2);
  
  const [formData, setFormData] = useState({
    empresa_id: empresaDefault,
    cedula: "",
    nombre: "",
    apellido: "",
    fecha_nacimiento: "",
    fecha_ingreso: "",
    cargo: "",
    departamento: "",
    sueldo_base: 0,
    tipo_moneda_sueldo: "USD" as "USD" | "VES",
    estatus: "ACTIVO" as const,
    tipo_contrato: "INDEFINIDO" as const,
    tiene_hijos: false,
    cantidad_hijos: 0
  });
  
  // Filtrar empleados según empresa seleccionada y permisos
  const empleadosFiltrados = empleados.filter(emp => {
    const empresaSeleccionada = empresaFilter === 'all' ? true : emp.empresa_id === empresaFilter;
    const tienePermiso = puedeVerTodasEmpresas() || empresasPermitidas.includes(emp.empresa_id);
    return empresaSeleccionada && tienePermiso;
  });

  // Aplicar filtros de búsqueda
  const empleadosAMostrar = empleadosFiltrados.filter(emp => {
    const searchLower = searchTerm.toLowerCase();
    return (
      emp.nombre.toLowerCase().includes(searchLower) ||
      emp.apellido?.toLowerCase().includes(searchLower) ||
      emp.cedula.toLowerCase().includes(searchLower) ||
      emp.cargo?.toLowerCase().includes(searchLower)
    );
  });

  // Obtener nombre de empresa por ID
  const getEmpresaNombre = (empresaId: number) => {
    const empresa = empresas.find(e => e.id === empresaId);
    return empresa?.nombre || 'Desconocida';
  };

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
    // Pass editMode as excludeId when editing to allow the same cedula
    if (!validarCedulaUnica(formData.cedula, formData.empresa_id, editMode || undefined)) {
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
      empresa_id: empresaDefault,
      cedula: "",
      nombre: "",
      apellido: "",
      fecha_nacimiento: "",
      fecha_ingreso: "",
      cargo: "",
      departamento: "",
      sueldo_base: 0,
      tipo_moneda_sueldo: "USD",
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
      sueldo_base: empleado.sueldo_base,
      tipo_moneda_sueldo: empleado.tipo_moneda_sueldo || "USD",
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

  const handleTransfer = () => {
    if (transferirId && empresaDestinoTransfer) {
      const empleado = empleados.find(e => e.id === transferirId);
      const empresaOrigen = empresas.find(e => e.id === empleado?.empresa_id);
      const empresaDestino = empresas.find(e => e.id === empresaDestinoTransfer);
      
      if (empleado && empresaOrigen && empresaDestino) {
        updateEmpleado(transferirId, { empresa_id: empresaDestinoTransfer });
        setSuccessMessage(`${empleado.nombre} ${empleado.apellido || ''} transferido de ${empresaOrigen.nombre} a ${empresaDestino.nombre}`);
        setTransferirId(null);
        setEmpresaOrigenTransfer(null);
        setEmpresaDestinoTransfer(null);
      }
    } else {
      setError("Debe seleccionar una empresa de destino");
    }
  };

  const openTransferModal = (empleado: any) => {
    setTransferirId(empleado.id);
    setEmpresaOrigenTransfer(empleado.empresa_id);
    setEmpresaDestinoTransfer(null);
  };

  // Filtrar empleados por empresa (aislamiento multi-tenant)
  // Primero filtra por permisos, luego por búsqueda y empresa
  const filteredEmpleados = empleadosFiltrados.filter(e => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = e.nombre.toLowerCase().includes(searchLower) ||
      (e.apellido?.toLowerCase().includes(searchLower) || false) ||
      e.cedula.includes(searchTerm) ||
      (e.cargo?.toLowerCase().includes(searchLower) || false);
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Personal</h2>
          <p className="text-neutral-400">Gestión de personal registrado</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <Plus className="w-4 h-4" />
          Nuevo Empleado
        </button>
      </div>

      {/* Buscador y Filtro */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o cédula..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400"
          />
        </div>
        <div className="min-w-[200px]">
          <select
            value={empresaFilter}
            onChange={(e) => setEmpresaFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
          >
            <option value="all">Todas las Empresas</option>
            {empresasPermitidasList.map(e => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {showForm && (
        <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editMode ? 'Editar Personal' : 'Nuevo Personal'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Asignar a Empresa *</label>
              <select
                value={formData.empresa_id}
                onChange={(e) => setFormData({ ...formData, empresa_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                required
              >
                <option value="">Seleccionar empresa...</option>
                {empresasPermitidasList.map(e => (
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
              <label className="block text-sm text-neutral-300 mb-1">Sueldo Base *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.sueldo_base}
                  onChange={(e) => setFormData({ ...formData, sueldo_base: parseFloat(e.target.value) })}
                  className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                  step="0.01"
                  min="0"
                  required
                />
                <select
                  value={formData.tipo_moneda_sueldo}
                  onChange={(e) => setFormData({ ...formData, tipo_moneda_sueldo: e.target.value as 'USD' | 'VES' })}
                  className="px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                >
                  <option value="USD">USD</option>
                  <option value="VES">VES</option>
                </select>
              </div>
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
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
                <Save className="w-4 h-4" />
                {editMode ? 'Guardar Cambios' : 'Registrar'}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditMode(null);
                }}
                className="px-4 py-2 bg-neutral-700 text-white rounded-lg flex items-center gap-2"
              >
                <X className="w-4 h-4" />
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
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">{mostrarEnBs ? 'Sueldo Bs.' : 'Sueldo USD'}</th>
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
                  <td className="px-4 py-3 text-white font-medium">{mostrarEnBs ? "Bs. " : "$"}{mostrarEnBs 
                    ? (empleado.tipo_moneda_sueldo === "USD" ? (empleado.sueldo_base * tasaCambio).toFixed(2) : empleado.sueldo_base.toFixed(2))
                    : (empleado.tipo_moneda_sueldo === "USD" ? empleado.sueldo_base.toFixed(2) : (empleado.sueldo_base / tasaCambio).toFixed(2))
                  }</td>
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
                        <>
                          <button
                            onClick={() => openTransferModal(empleado)}
                            className="p-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 rounded"
                            title="Transferir de Empresa"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEgresandoId(empleado.id)}
                            className="p-1.5 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 rounded"
                            title="Egresar"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </>
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

      {/* Modal de Transferencia de Empresa */}
      {transferirId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 rounded-xl p-6 max-w-md w-full mx-4 border border-neutral-700">
            <h3 className="text-lg font-semibold text-white mb-4">Transferir Personal de Empresa</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-300 mb-1">Empresa Origen</label>
                <input
                  type="text"
                  value={empresas.find(e => e.id === empresaOrigenTransfer)?.nombre || ''}
                  disabled
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-neutral-400"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-1">Empresa Destino *</label>
                <select
                  value={empresaDestinoTransfer || ''}
                  onChange={(e) => setEmpresaDestinoTransfer(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                  required
                >
                  <option value="">Seleccionar empresa...</option>
                  {empresas.filter(e => e.id !== empresaOrigenTransfer && e.status !== 'terminated').map(e => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-neutral-400">
                El personal mantendrá su historial de ingresos y datos básicos.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleTransfer}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                >
                  Confirmar Transferencia
                </button>
                <button
                  onClick={() => { setTransferirId(null); setEmpresaOrigenTransfer(null); setEmpresaDestinoTransfer(null); }}
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
function NominaView({ empresaId }: { empresaId?: number | null }) {
  const { empleados, empresas, tasaCambio, setSuccessMessage, setError, setLiquidaciones, liquidaciones, parametros, empresasPermitidas, puedeVerTodasEmpresas, empresaSeleccionadaId, setEmpresaSeleccionada, addToLoteEspera, updateInLoteEspera, removeFromLoteEspera, generateBatchFromCompany, clearLoteEspera, processLoteCompleto, loteEspera, updateEmpleado } = useAppStore();
  const router = useRouter();
  const [mostrarEnBs, setMostrarEnBs] = useState(true);
  const [quincena, setQuincena] = useState(1);
  const [procesando, setProcesando] = useState(false);
  const [tipoConcepto, setTipoConcepto] = useState<'NOMINA' | 'UTILIDADES' | 'AGUINALDOS'>('NOMINA');
  const [pagarBonoVacacional, setPagarBonoVacacional] = useState(false);
  const [pagarUtilidades, setPagarUtilidades] = useState(false);
  const [empleadoSeleccionadoId, setEmpleadoSeleccionadoId] = useState<number | null>(null);
  
  // Estados para selección múltiple en lote
  const [seleccionadosLote, setSeleccionadosLote] = useState<number[]>([]);
  
  // Estados para asignaciones/deducciones manuales en lote
  const [asignacionManualLote, setAsignacionManualLote] = useState<number>(0);
  const [deduccionManualLote, setDeduccionManualLote] = useState<number>(0);
  
  // Función para toggle de selección
  const toggleSeleccionLote = (empleadoId: number) => {
    setSeleccionadosLote(prev => 
      prev.includes(empleadoId) 
        ? prev.filter(id => id !== empleadoId)
        : [...prev, empleadoId]
    );
  };
  
  // Función para seleccionar todos
  const seleccionarTodosLote = () => {
    if (seleccionadosLote.length === loteEspera.length) {
      setSeleccionadosLote([]);
    } else {
      setSeleccionadosLote(loteEspera.map(l => l.empleado_id));
    }
  };
  
  // Función para aplicar conceptos a selección
  const aplicarASeleccion = (tipo: 'asignacion' | 'deduccion', monto: number) => {
    if (seleccionadosLote.length === 0 || monto <= 0) return;
    
    const { updateInLoteEspera, loteEspera } = require('@/lib/store').useAppStore.getState();
    
    seleccionadosLote.forEach(empleadoId => {
      const item = loteEspera.find((l: any) => l.empleado_id === empleadoId);
      if (item) {
        const liquidacion = { ...item.liquidacion };
        if (tipo === 'asignacion') {
          liquidacion.otras_asignaciones = (liquidacion.otras_asignaciones || 0) + monto;
          liquidacion.total_asignaciones = liquidacion.sueldo_base + liquidacion.bono_vacacional + liquidacion.utilidades + liquidacion.otras_asignaciones;
          liquidacion.neto_pagar = liquidacion.total_asignaciones - liquidacion.total_deducciones;
          liquidacion.monto_bs = liquidacion.neto_pagar;
        } else {
          liquidacion.otras_deducciones = (liquidacion.otras_deducciones || 0) + monto;
          liquidacion.total_deducciones = liquidacion.ivss_trabajador + liquidacion.rpe_trabajador + liquidacion.faov_trabajador + liquidacion.inces_trabajador + liquidacion.otras_deducciones;
          liquidacion.neto_pagar = liquidacion.total_asignaciones - liquidacion.total_deducciones;
          liquidacion.monto_bs = liquidacion.neto_pagar;
        }
        updateInLoteEspera(empleadoId, liquidacion);
      }
    });
    setSuccessMessage(`Monto aplicado a ${seleccionadosLote.length} empleado(s)`);
    setAsignacionManualLote(0);
    setDeduccionManualLote(0);
    setSeleccionadosLote([]);
  };
  
  // Función para guardar empleado individual desde el lote
  // Guarda las asignaciones y deducciones manuales sin borrar al cambiar de empleado
  const guardarRegistroIndividual = (empleadoId: number) => {
    const item = loteEspera.find(l => l.empleado_id === empleadoId);
    if (item) {
      // Calcular totales de conceptos manuales activos
      const emp = empleados.find(e => e.id === empleadoId);
      const sb = emp?.sueldo_base || 0;
      
      // Calcular asignaciones manuales
      const totalAsigManual = conceptosAsignaciones
        .filter(c => c.activo)
        .reduce((sum, c) => {
          if (c.tipo === 'MONTO_FIJO') return sum + c.valor;
          if (c.tipo === 'PORCENTAJE') return sum + (sb * c.valor / 100);
          return sum;
        }, 0);
      
      // Calcular deducciones manuales
      const totalDedManual = conceptosDeducciones
        .filter(c => c.activo)
        .reduce((sum, c) => {
          if (c.tipo === 'MONTO_FIJO') return sum + c.valor;
          if (c.tipo === 'PORCENTAJE') return sum + (sb * c.valor / 100);
          return sum;
        }, 0);
      
      // Actualizar la liquidación del empleado en el lote
      const liquidacionActualizada = {
        ...item.liquidacion,
        otras_asignaciones: Math.round(totalAsigManual * 100) / 100,
        otras_deducciones: Math.round(totalDedManual * 100) / 100,
        total_asignaciones: Math.round((item.liquidacion.sueldo_base + item.liquidacion.bono_vacacional + item.liquidacion.utilidades + totalAsigManual) * 100) / 100,
        total_deducciones: Math.round((item.liquidacion.ivss_trabajador + item.liquidacion.rpe_trabajador + item.liquidacion.faov_trabajador + item.liquidacion.inces_trabajador + totalDedManual) * 100) / 100,
        neto_pagar: Math.round((item.liquidacion.sueldo_base + item.liquidacion.bono_vacacional + item.liquidacion.utilidades + totalAsigManual - item.liquidacion.ivss_trabajador - item.liquidacion.rpe_trabajador - item.liquidacion.faov_trabajador - item.liquidacion.inces_trabajador - totalDedManual) * 100) / 100,
        monto_bs: Math.round((item.liquidacion.sueldo_base + item.liquidacion.bono_vacacional + item.liquidacion.utilidades + totalAsigManual - item.liquidacion.ivss_trabajador - item.liquidacion.rpe_trabajador - item.liquidacion.faov_trabajador - item.liquidacion.inces_trabajador - totalDedManual) * 100) / 100
      };
      
      updateInLoteEspera(empleadoId, liquidacionActualizada);
      setSuccessMessage(`Registro individual guardado: ${item.empleado_nombre} - Asig: Bs. ${totalAsigManual.toFixed(2)}, Deduc: Bs. ${totalDedManual.toFixed(2)}`);
    }
  };
  
  // Función para formatear números con formato regional (punto miles, coma decimales)
  // Usa Intl.NumberFormat('es-VE') para cumplimiento strict
  const formatearNumero = (valor: number): string => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  };
  
  // Estado para forzar re-render después de guardar
  const [refreshKey, setRefreshKey] = useState(0);
  
  // ============================================================
  // FUNCIÓN: saveIndividualRecord()
  // Guarda asignaciones/deducciones manuales del empleado individual
  // ============================================================
  const saveIndividualRecord = (empleadoId: number) => {
    console.log('[saveIndividualRecord] Iniciando guardado para empleadoId:', empleadoId);
    
    const item = loteEspera.find(l => l.empleado_id === empleadoId);
    if (!item) {
      console.error('[saveIndividualRecord] No se encontró el empleado en loteEspera');
      setError('ERROR: No se encontró el empleado en el lote');
      return;
    }
    
    const emp = empleados.find(e => e.id === empleadoId);
    const sb = emp?.sueldo_base || 0;
    
    console.log('[saveIndividualRecord] Empleado encontrado:', item.empleado_nombre, 'Sueldo base:', sb);
    
    const totalAsigManual = conceptosAsignaciones
      .filter(c => c.activo)
      .reduce((sum, c) => {
        if (c.tipo === 'MONTO_FIJO') return sum + c.valor;
        if (c.tipo === 'PORCENTAJE') return sum + (sb * c.valor / 100);
        return sum;
      }, 0);
    
    const totalDedManual = conceptosDeducciones
      .filter(c => c.activo)
      .reduce((sum, c) => {
        if (c.tipo === 'MONTO_FIJO') return sum + c.valor;
        if (c.tipo === 'PORCENTAJE') return sum + (sb * c.valor / 100);
        return sum;
      }, 0);
    
    const liquidacionActualizada = {
      ...item.liquidacion,
      otras_asignaciones: Math.round(totalAsigManual * 100) / 100,
      otras_deducciones: Math.round(totalDedManual * 100) / 100,
      total_asignaciones: Math.round((item.liquidacion.sueldo_base + item.liquidacion.bono_vacacional + item.liquidacion.utilidades + totalAsigManual) * 100) / 100,
      total_deducciones: Math.round((item.liquidacion.ivss_trabajador + item.liquidacion.rpe_trabajador + item.liquidacion.faov_trabajador + item.liquidacion.inces_trabajador + totalDedManual) * 100) / 100,
      neto_pagar: Math.round((item.liquidacion.sueldo_base + item.liquidacion.bono_vacacional + item.liquidacion.utilidades + totalAsigManual - item.liquidacion.ivss_trabajador - item.liquidacion.rpe_trabajador - item.liquidacion.faov_trabajador - item.liquidacion.inces_trabajador - totalDedManual) * 100) / 100,
      monto_bs: Math.round((item.liquidacion.sueldo_base + item.liquidacion.bono_vacacional + item.liquidacion.utilidades + totalAsigManual - item.liquidacion.ivss_trabajador - item.liquidacion.rpe_trabajador - item.liquidacion.faov_trabajador - item.liquidacion.inces_trabajador - totalDedManual) * 100) / 100
    };
    
    console.log('[saveIndividualRecord] Actualizando loteEspera con ID:', empleadoId, 'Nuevos valores:', liquidacionActualizada);
    
    // Actualizar en el store
    updateInLoteEspera(empleadoId, liquidacionActualizada);
    
    // Forzar re-render para actualizar la vista
    setRefreshKey(prev => prev + 1);
    
    setSuccessMessage(`✓ GUARDADO: ${item.empleado_nombre} | Asig: Bs. ${formatearNumero(totalAsigManual)} | Deduc: Bs. ${formatearNumero(totalDedManual)}`);
    
    console.log('[saveIndividualRecord] Guardado completado, refreshKey:', refreshKey + 1);
  };
  
  // Estados para beneficios individuales por trabajador - derivados del empleado seleccionado
  // Se calculan después de obtener empleadoSeleccionado

  // Función para guardar la configuración individual del empleado
  const guardarConfiguracionIndividual = (campo: 'pagar_bono_vacacional' | 'pagar_utilidades', valor: boolean) => {
    if (!empleadoSeleccionadoId) return;
    
    const updateData: Partial<Empleado> = {};
    updateData[campo] = valor;
    updateEmpleado(empleadoSeleccionadoId, updateData);
  };

  // Conceptos manuales dinámicos
  const [conceptosAsignaciones, setConceptosAsignaciones] = useState<ConceptoManual[]>([]);
  const [conceptosDeducciones, setConceptosDeducciones] = useState<ConceptoManual[]>([]);

  const generarIdConcepto = () => Math.random().toString(36).substring(2, 11);

  // Funciones para gestionar conceptos manuales
  const agregarConceptoAsignacion = () => {
    setConceptosAsignaciones([...conceptosAsignaciones, { id: generarIdConcepto(), denominacion: '', tipo: 'MONTO_FIJO', valor: 0, observaciones: '', activo: true }]);
  };
  const agregarConceptoDeduccion = () => {
    setConceptosDeducciones([...conceptosDeducciones, { id: generarIdConcepto(), denominacion: '', tipo: 'MONTO_FIJO', valor: 0, observaciones: '', activo: true }]);
  };
  const actualizarConceptoAsignacion = (id: string, campo: keyof ConceptoManual, valor: any) => {
    setConceptosAsignaciones(conceptosAsignaciones.map(c => c.id === id ? { ...c, [campo]: valor } : c));
  };
  const actualizarConceptoDeduccion = (id: string, campo: keyof ConceptoManual, valor: any) => {
    setConceptosDeducciones(conceptosDeducciones.map(c => c.id === id ? { ...c, [campo]: valor } : c));
  };
  const eliminarConceptoAsignacion = (id: string) => {
    setConceptosAsignaciones(conceptosAsignaciones.filter(c => c.id !== id));
  };
  const eliminarConceptoDeduccion = (id: string) => {
    setConceptosDeducciones(conceptosDeducciones.filter(c => c.id !== id));
  };
  const calcularTotalConceptosAsignaciones = (sueldoBase: number) => conceptosAsignaciones.filter(c => c.activo && c.denominacion.trim() !== '').reduce((total, c) => c.tipo === 'MONTO_FIJO' ? total + c.valor : total + (sueldoBase * (c.valor / 100)), 0);
  const calcularTotalConceptosDeducciones = (sueldoBase: number) => conceptosDeducciones.filter(c => c.activo && c.denominacion.trim() !== '').reduce((total, c) => c.tipo === 'MONTO_FIJO' ? total + c.valor : total + (sueldoBase * (c.valor / 100)), 0);
  
  // Obtener empresas permitidas para el selector
  const empresasPermitidasList = puedeVerTodasEmpresas() 
    ? empresas.filter(e => e.id !== 1) 
    : empresas.filter(e => empresasPermitidas.includes(e.id));
  
  // Usar empresaId si está seleccionado, o la primera empresa permitida
  // Persistir la selección en el estado global
  const empresaDefault = empresaSeleccionadaId || empresaId || (empresasPermitidasList.length > 0 ? empresasPermitidasList[0].id : 2);
  const [empresaSeleccionada, setEmpresaSeleccionadaLocal] = useState<number>(empresaDefault);

  // Handler para cambio de empresa desde el selector - persiste en estado global
  const handleEmpresaChange = (nuevaEmpresa: number) => {
    setEmpresaSeleccionada(nuevaEmpresa);
    setEmpresaSeleccionadaLocal(nuevaEmpresa);
    setEmpleadoSeleccionadoId(null);
    setLiquidaciones([]);
    // Generar lote automático con todos los empleados de la empresa
    generateBatchFromCompany(nuevaEmpresa, empleados, empresas, parametros, tasaCambio);
  };

  // Efecto para generar lote automático cuando cambia la empresa
  useEffect(() => {
    if (empresaSeleccionada && empresaSeleccionada > 0) {
      generateBatchFromCompany(empresaSeleccionada, empleados, empresas, parametros, tasaCambio);
    }
  }, [empresaSeleccionada]);

  // Obtener empleados filtrados por la empresa seleccionada
  const empleadosPorEmpresa = empleados.filter(e => {
    const tienePermiso = puedeVerTodasEmpresas() || empresasPermitidas.includes(e.empresa_id);
    return e.estatus === 'ACTIVO' && e.empresa_id !== 1 && e.empresa_id === empresaSeleccionada && tienePermiso;
  });

  // Obtener el empleado seleccionado para mostrar su sueldo base
  const empleadoSeleccionado = empleadoSeleccionadoId ? empleados.find(e => e.id === empleadoSeleccionadoId) : null;

  // Beneficios individuales derivados del empleado seleccionado
  const pagarBonoVacacionalIndividual = empleadoSeleccionado?.pagar_bono_vacacional ?? false;
  const pagarUtilidadesIndividual = empleadoSeleccionado?.pagar_utilidades ?? false;

  // Obtener datos del lote para el empleado seleccionado (si existe)
  const empleadoEnLote = empleadoSeleccionadoId 
    ? loteEspera.find(l => l.empleado_id === empleadoSeleccionadoId) 
    : null;

  // Cargar datos del lote cuando se selecciona un empleado
  useEffect(() => {
    if (empleadoEnLote && empleadoSeleccionadoId) {
      // Los datos ya están calculados en el lote, se muestran en la tabla de resumen
    }
  }, [empleadoSeleccionadoId, empleadoEnLote]);

  // Obtener la empresa seleccionada para verificar su estatus
  const empresaActual = empresas.find(e => e.id === empresaSeleccionada);
  const estatusEmpresa = empresaActual?.status || 'active';

  // ============================================================
  // BLOQUEO POR ESTATUS DE EMPRESA
  // ============================================================
  
  // Si la empresa está SUSPENDIDA - redirigir al muro de pago (solo si hay empresa válida seleccionada)
  useEffect(() => {
    if (empresaSeleccionada && empresaSeleccionada > 0 && estatusEmpresa === 'suspended') {
      router.push('/service-suspended');
    }
  }, [empresaSeleccionada, estatusEmpresa, router]);

  // Si la empresa está TERMINADA - modo solo lectura
  const esEmpresaTerminada = estatusEmpresa === 'terminated';

  // Filtrar empleados activos por empresa seleccionada
  const empleadosActivos = empleadosPorEmpresa.filter(e => e.estatus === 'ACTIVO');

  const procesarNomina = async (guardarEnLote: boolean = false) => {
    // Validar que hay una empresa seleccionada
    if (!empresaSeleccionada) {
      setError("ERROR: Debe seleccionar una empresa");
      return;
    }
    
    // Validar que la empresa tiene empleados
    if (empleadosPorEmpresa.length === 0) {
      setError("ERROR: Esta empresa no tiene personal registrado. Agregue personal en la sección de Personal.");
      return;
    }
    
    // Validar que hay un empleado seleccionado para guardar en lote
    if (guardarEnLote && !empleadoSeleccionadoId) {
      setError("ERROR: Debe seleccionar un trabajador para guardar en lote");
      return;
    }
    
    setProcesando(true);
    
    const parametrosNomina: ParametrosNomina = {
      salarioMinimo: parametros.salario_minimo,
      numEmpleados: empleadosActivos.length,
      tasaCambio: tasaCambio,
      umv: parametros.umv,
      tipoConcepto,
      pagarBonoVacacional,
      pagarUtilidades,
      bonoTransporte: quincena === 2 ? parametros.bono_transporte : 0,
      cestaTicket: quincena === 2 ? parametros.cesta_ticket : 0
    };

    const conceptosAsignacionesActivos = conceptosAsignaciones.filter(c => c.activo && c.denominacion.trim() !== '');
    const conceptosDeduccionesActivos = conceptosDeducciones.filter(c => c.activo && c.denominacion.trim() !== '');

    // Si hay un empleado seleccionado, procesar solo ese empleado
    const empleadosAProcesar = empleadoSeleccionadoId 
      ? empleadosActivos.filter(e => e.id === empleadoSeleccionadoId)
      : empleadosActivos;

    const nuevasLiquidaciones: Liquidacion[] = empleadosAProcesar.map(emp => {
      const empresa = empresas.find(e => e.id === emp.empresa_id);
      const lunes = empresa?.lunes_mes || 4;
      const diasQuincena = 15;
      
      // === PRORRATEO POR FECHA DE INGRESO ===
      // Calcular días trabajados según fecha de ingreso
      const hoy = new Date();
      const ano = hoy.getFullYear();
      const mes = hoy.getMonth() + 1;
      const fechaIngreso = new Date(emp.fecha_ingreso);
      const inicioPeriodo = new Date(ano, mes - 1, 1);
      const finPeriodo = new Date(ano, mes - 1, diasQuincena);
      
      let diasLaborados: number;
      if (fechaIngreso <= inicioPeriodo) {
        // Trabajó todo el período
        diasLaborados = diasQuincena;
      } else if (fechaIngreso <= finPeriodo) {
        // Ingresó durante el período - calcular días desde ingreso
        const diasDesdeIngreso = Math.min(diasQuincena, Math.max(0, diasQuincena - (fechaIngreso.getDate() - 1)));
        diasLaborados = Math.max(0, diasDesdeIngreso);
      } else {
        // No trabajó en el período
        diasLaborados = 0;
      }
      
      const dias = diasLaborados;
      const sueldoBaseUSD = emp.tipo_moneda_sueldo === "USD" ? emp.sueldo_base : emp.sueldo_base / tasaCambio;
      
      const adicionalesAsignaciones = calcularTotalConceptosAsignaciones(sueldoBaseUSD);
      const adicionalesDeducciones = calcularTotalConceptosDeducciones(sueldoBaseUSD);
      
      const result = engineLOTTT.procesarLiquidacion(
        {
          diasLaborados: dias,
          lunesPeriodo: lunes,
          sueldoBase: sueldoBaseUSD,
          fechaIngreso: emp.fecha_ingreso,
          tieneHijos: emp.tiene_hijos,
          cantidadHijos: emp.cantidad_hijos,
          // Datos para cálculos proporcionales
          fechaEgreso: emp.fecha_egreso,
          // Beneficios individuales por trabajador
          pagarBonoVacacionalIndividual: emp.pagar_bono_vacacional,
          pagarUtilidadesIndividual: emp.pagar_utilidades,
          // Fechas del período para cálculos proporcionales
          fechaInicioPeriodo: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
          fechaFinPeriodo: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-30`
        },
        parametrosNomina
      );

      const nuevasAsignaciones = result.total_asignaciones + adicionalesAsignaciones;
      const nuevasDeducciones = result.total_deducciones + adicionalesDeducciones;
      const nuevoNeto = nuevasAsignaciones - nuevasDeducciones;

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
        otras_asignaciones: adicionalesAsignaciones,
        total_asignaciones: nuevasAsignaciones,
        ivss_trabajador: result.ivss_trabajador,
        rpe_trabajador: result.rpe_trabajador,
        faov_trabajador: result.faov_trabajador,
        inces_trabajador: result.inces_trabajador,
        inces_patronal: result.inces_patronal,
        otras_deducciones: adicionalesDeducciones,
        total_deducciones: nuevasDeducciones,
        neto_pagar: nuevoNeto,
        tipo_cambio_usd: tasaCambio,
        monto_bs: nuevoNeto * tasaCambio,
        fecha_liquidacion: new Date().toISOString(),
        // Auditoría individual de tasa BCV por trabajador
        tasa_bcv_fecha: new Date().toISOString(),
        tasa_bcv_oficial: tasaCambio,
        conceptos_asignaciones: conceptosAsignacionesActivos,
        conceptos_deducciones: conceptosDeduccionesActivos
      };
    });

    if (guardarEnLote) {
      // Guardar cada empleado en el lote de espera (actualiza si ya existe)
      nuevasLiquidaciones.forEach((liquidacion, index) => {
        const emp = empleadosAProcesar[index];
        if (empleadoSeleccionadoId) {
          // Si se editsó un empleado específico, actualizar en lote
          updateInLoteEspera(emp.id, liquidacion);
        } else {
          // Agregar normalmente
          addToLoteEspera({
            empleado_id: emp.id,
            empleado_nombre: `${emp.nombre} ${emp.apellido || ''}`,
            empleado_cedula: emp.cedula,
            liquidacion,
            fecha_agregado: new Date().toISOString()
          });
        }
      });
      setSuccessMessage(`Empleado(s) guardado(s) en lote. Total en espera: ${loteEspera.length + nuevasLiquidaciones.length}`);
    } else {
      setLiquidaciones(nuevasLiquidaciones);
      setSuccessMessage("Nómina procesada correctamente");
    }
    setProcesando(false);
  };

  // Procesar lote completo (Guardar todos los empleados en lote)
  const guardarEnLoteTodos = async () => {
    if (!empresaSeleccionada) {
      setError("ERROR: Debe seleccionar una empresa");
      return;
    }
    if (loteEspera.length === 0) {
      // Si no hay lote, generar uno nuevo
      generateBatchFromCompany(empresaSeleccionada, empleados, empresas, parametros, tasaCambio);
      setSuccessMessage("Lote generado automáticamente con todos los empleados");
      return;
    }
    // Si ya hay lote, simplemente mostrar el mensaje
    setSuccessMessage(`Lote listo con ${loteEspera.length} empleado(s)`);
  };

  // Procesar nómina general (guardar todos los del lote al historial)
  const procesarNominaGeneral = async () => {
    if (loteEspera.length === 0) {
      setError("ERROR: No hay empleados en el lote de espera. Agregue empleados usando 'Guardar en Lote'.");
      return;
    }
    
    setProcesando(true);
    
    // Obtener liquidaciones del lote y guardarlas junto con el asiento contable
    const resultado = processLoteCompleto(0);
    setLiquidaciones(resultado.liquidaciones);
    
    // Mostrar mensaje
    setSuccessMessage(`Nómina general procesada: ${resultado.liquidaciones.length} empleado(s) guardado(s) en el historial`);
    
    // Regenerar lote para el siguiente período
    generateBatchFromCompany(empresaSeleccionada, empleados, empresas, parametros, tasaCambio);
    setProcesando(false);
  };

  // Limpiar lote y regenerar con datos base
  const handleClearLote = () => {
    clearLoteEspera();
    generateBatchFromCompany(empresaSeleccionada, empleados, empresas, parametros, tasaCambio);
    setSuccessMessage("Lote limpiado y regenerado con datos base");
  };

  // Calcular totales del lote
  const totalLoteAsignaciones = loteEspera.reduce((sum, l) => sum + l.liquidacion.total_asignaciones, 0);
  const totalLoteDeducciones = loteEspera.reduce((sum, l) => sum + l.liquidacion.total_deducciones, 0);
  const totalLoteNeto = loteEspera.reduce((sum, l) => sum + l.liquidacion.neto_pagar, 0);
  const totalLoteBs = loteEspera.reduce((sum, l) => sum + l.liquidacion.monto_bs, 0);

  // Calcular totales
  const totalAsignaciones = liquidaciones.reduce((sum, l) => sum + l.total_asignaciones, 0);
  const totalDeducciones = liquidaciones.reduce((sum, l) => sum + l.total_deducciones, 0);
  const totalNeto = liquidaciones.reduce((sum, l) => sum + l.neto_pagar, 0);
  const totalBs = liquidaciones.reduce((sum, l) => sum + l.monto_bs, 0);

  // Generar recibo PDF individual
  const generarReciboPDF = (liq: any) => {
    const emp = empleados.find(e => e.id === liq.empleado_id);
    const empresa = empresas.find(e => e.id === liq.empresa_id);
    
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
        ano: liq.ano,
        mes: liq.mes,
        quincena: liq.quincena,
        dias_trabajados: liq.dias_trabajados,
        fecha_pago: new Date().toLocaleDateString("es-VE")
      },
      // Construir array de asignaciones visibles (solo las que tienen monto > 0)
      asignaciones: (() => {
        const conceptos: { descripcion: string; monto: number }[] = [];
        if (liq.sueldo_base > 0) conceptos.push({ descripcion: "Sueldo Base", monto: liq.sueldo_base });
        if (liq.bono_vacacional > 0) conceptos.push({ descripcion: "Bono Vacacional", monto: liq.bono_vacacional });
        if (liq.utilidades > 0) conceptos.push({ descripcion: "Utilidades", monto: liq.utilidades });
        if (liq.bono_transporte > 0) conceptos.push({ descripcion: "Bono Transporte", monto: liq.bono_transporte });
        if (liq.cesta_ticket > 0) conceptos.push({ descripcion: "Cesta Ticket", monto: liq.cesta_ticket });
        // Agregar conceptos manuales de asignaciones
        (liq.conceptos_asignaciones || [])
          .filter((c: ConceptoManual) => c.activo && c.denominacion.trim() !== '' && c.valor > 0)
          .forEach((c: ConceptoManual) => {
            const monto = c.tipo === 'MONTO_FIJO' ? c.valor : liq.sueldo_base * (c.valor / 100);
            if (monto > 0) conceptos.push({ descripcion: c.denominacion, monto });
          });
        return conceptos;
      })(),
      // Construir array de deducciones visibles (solo las que tienen monto > 0)
      deducciones: (() => {
        const conceptos: { descripcion: string; monto: number }[] = [];
        if (liq.ivss_trabajador > 0) conceptos.push({ descripcion: "IVSS", monto: liq.ivss_trabajador });
        if (liq.rpe_trabajador > 0) conceptos.push({ descripcion: "RPE", monto: liq.rpe_trabajador });
        if (liq.faov_trabajador > 0) conceptos.push({ descripcion: "FAOV", monto: liq.faov_trabajador });
        if (liq.inces_trabajador > 0) conceptos.push({ descripcion: "INCES", monto: liq.inces_trabajador });
        // Agregar deducciones manuales (estas pueden generar aportes patronales)
        (liq.conceptos_deducciones || [])
          .filter((c: ConceptoManual) => c.activo && c.denominacion.trim() !== '' && c.valor > 0)
          .forEach((c: ConceptoManual) => {
            const monto = c.tipo === 'MONTO_FIJO' ? c.valor : liq.sueldo_base * (c.valor / 100);
            if (monto > 0) conceptos.push({ descripcion: c.denominacion, monto });
          });
        return conceptos;
      })(),
      // Calcular totales como suma de conceptos visibles para integridad del recibo
      totales: {
        total_asignaciones: (() => {
          const conceptos = [];
          if (liq.sueldo_base > 0) conceptos.push(liq.sueldo_base);
          if (liq.bono_vacacional > 0) conceptos.push(liq.bono_vacacional);
          if (liq.utilidades > 0) conceptos.push(liq.utilidades);
          if (liq.bono_transporte > 0) conceptos.push(liq.bono_transporte);
          if (liq.cesta_ticket > 0) conceptos.push(liq.cesta_ticket);
          (liq.conceptos_asignaciones || [])
            .filter((c: ConceptoManual) => c.activo && c.denominacion.trim() !== '' && c.valor > 0)
            .forEach((c: ConceptoManual) => {
              const monto = c.tipo === 'MONTO_FIJO' ? c.valor : liq.sueldo_base * (c.valor / 100);
              if (monto > 0) conceptos.push(monto);
            });
          return conceptos.reduce((a, b) => a + b, 0);
        })(),
        total_deducciones: (() => {
          const conceptos = [];
          if (liq.ivss_trabajador > 0) conceptos.push(liq.ivss_trabajador);
          if (liq.rpe_trabajador > 0) conceptos.push(liq.rpe_trabajador);
          if (liq.faov_trabajador > 0) conceptos.push(liq.faov_trabajador);
          if (liq.inces_trabajador > 0) conceptos.push(liq.inces_trabajador);
          (liq.conceptos_deducciones || [])
            .filter((c: ConceptoManual) => c.activo && c.denominacion.trim() !== '' && c.valor > 0)
            .forEach((c: ConceptoManual) => {
              const monto = c.tipo === 'MONTO_FIJO' ? c.valor : liq.sueldo_base * (c.valor / 100);
              if (monto > 0) conceptos.push(monto);
            });
          return conceptos.reduce((a, b) => a + b, 0);
        })(),
        neto_pagar: liq.neto_pagar,
        tasa_cambio: liq.tasa_bcv_oficial || tasaCambio,
        neto_bs: liq.monto_bs
      },
      fecha_liquidacion: new Date().toLocaleDateString("es-VE")
    };

    const doc = generarReciboLiquidacion(data);
    descargarPDF(doc, `recibo_${emp.cedula}_${liq.mes}_${liq.quincena}.pdf`);
    setSuccessMessage("Recibo descargado");
  };

  return (
    <div className="space-y-6">
      {/* Banner de solo lectura para empresas terminadas */}
      {esEmpresaTerminada && (
        <div className="bg-amber-900/30 border border-amber-600 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-6 h-6 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-amber-400 font-semibold">Nómina histórica en modo lectura (Empresa Terminada)</p>
            <p className="text-amber-300/70 text-sm">Los datos se muestran con fines de consulta únicamente. No se pueden realizar nuevos cálculos.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Procesar Nómina</h2>
          <p className="text-neutral-400">Cálculos según Ley LOTTT Venezuela</p>
        </div>
        
        {/* Selector de Moneda */}
        <div className="flex items-center gap-2 bg-neutral-800 rounded-lg p-1 border border-neutral-700">
          <button
            onClick={() => setMostrarEnBs(false)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              !mostrarEnBs 
                ? 'bg-blue-600 text-white' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            USD
          </button>
          <button
            onClick={() => setMostrarEnBs(true)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mostrarEnBs 
                ? 'bg-green-600 text-white' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            BS
          </button>
        </div>
      </div>

      {/* Controles */}
      <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
        <div className="flex flex-wrap items-end gap-4">
          {/* Selector de Empresa */}
          <div>
            <label className="block text-sm text-neutral-300 mb-1">Empresa</label>
            <select
              value={empresaSeleccionada}
              onChange={(e) => handleEmpresaChange(parseInt(e.target.value))}
              className="px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white min-w-[200px] disabled:opacity-50"
              disabled={esEmpresaTerminada || (!puedeVerTodasEmpresas() && empresasPermitidas.length === 1)}
            >
              {empresasPermitidasList.map(e => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>

          {/* Selector de Trabajador - Solo aparece cuando hay empresa seleccionada */}
          {empresaSeleccionada > 0 && (
            <div>
              <label className="block text-sm text-neutral-300 mb-1">
                Seleccionar Trabajador/Obrero {!empleadoSeleccionadoId && <span className="text-red-400 ml-1">*</span>}
              </label>
              <select
                value={empleadoSeleccionadoId || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const nuevoId = val ? parseInt(val) : null;
                  // Limpieza de seguridad: Si cambia de trabajador, limpiar conceptos para evitar cruce de datos
                  if (nuevoId !== empleadoSeleccionadoId) {
                    setConceptosAsignaciones([]);
                    setConceptosDeducciones([]);
                    setLiquidaciones([]);
                  }
                  setEmpleadoSeleccionadoId(nuevoId);
                }}
                className="px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white min-w-[250px] disabled:opacity-50"
                disabled={esEmpresaTerminada || empleadosPorEmpresa.length === 0}
              >
                <option value="">-- Seleccionar --</option>
                {empleadosPorEmpresa.length === 0 ? (
                  <option disabled>Esta empresa no tiene personal registrado</option>
                ) : (
                  empleadosPorEmpresa.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.nombre} {emp.apellido} - {emp.cedula}</option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Etiqueta de Sueldo Base cuando hay trabajador seleccionado */}
          {empleadoSeleccionado && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-600/50 rounded-lg">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">
                Sueldo Base: {empleadoSeleccionado.tipo_moneda_sueldo === 'USD' ? `$${empleadoSeleccionado.sueldo_base.toFixed(2)}` : `Bs. ${empleadoSeleccionado.sueldo_base.toFixed(2)}`} (Literal)
              </span>
            </div>
          )}

          {/* Checkboxes de Beneficios Individuales - Solo cuando hay trabajador seleccionado */}
          {empleadoSeleccionado && tipoConcepto === 'NOMINA' && (
            <div className="flex flex-wrap gap-3 px-4 py-2 bg-purple-600/20 border border-purple-600/50 rounded-lg">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bonoVacacionalIndividual"
                  checked={pagarBonoVacacionalIndividual === true}
                  onChange={(e) => {
                    const valor = e.target.checked;
                    guardarConfiguracionIndividual('pagar_bono_vacacional', valor);
                  }}
                  className="w-4 h-4 accent-purple-500"
                  disabled={esEmpresaTerminada}
                />
                <label htmlFor="bonoVacacionalIndividual" className="text-sm text-purple-300">
                  Bono Vacacional
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="utilidadesIndividual"
                  checked={pagarUtilidadesIndividual === true}
                  onChange={(e) => {
                    const valor = e.target.checked;
                    guardarConfiguracionIndividual('pagar_utilidades', valor);
                  }}
                  className="w-4 h-4 accent-purple-500"
                  disabled={esEmpresaTerminada}
                />
                <label htmlFor="utilidadesIndividual" className="text-sm text-purple-300">
                  Utilidades
                </label>
              </div>
              <span className="text-xs text-neutral-400 ml-2">(Por trabajador)</span>
            </div>
          )}

          <div>
            <label className="block text-sm text-neutral-300 mb-1">Quincena</label>
            <select
              value={quincena}
              onChange={(e) => setQuincena(parseInt(e.target.value))}
              className="px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white disabled:opacity-50"
              disabled={esEmpresaTerminada}
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
              className="px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white disabled:opacity-50"
              disabled={esEmpresaTerminada}
            >
              <option value="NOMINA">Nómina Ordinaria</option>
              <option value="UTILIDADES">Utilidades</option>
              <option value="AGUINALDOS">Aguinaldos</option>
            </select>
          </div>

          {tipoConcepto === 'NOMINA' && (
            <div className={`flex items-center gap-2 px-4 py-2 bg-neutral-700 rounded-lg ${esEmpresaTerminada ? 'opacity-50' : ''}`}>
              <input
                type="checkbox"
                id="bonoVacacional"
                checked={pagarBonoVacacional}
                onChange={(e) => setPagarBonoVacacional(e.target.checked)}
                className="w-4 h-4"
                disabled={esEmpresaTerminada}
              />
              <label htmlFor="bonoVacacional" className="text-sm text-neutral-300">
                PAGAR BONO VACACIONAL
              </label>
            </div>
          )}
          
          {tipoConcepto === 'NOMINA' && (
            <div className={`flex items-center gap-2 px-4 py-2 bg-neutral-700 rounded-lg ${esEmpresaTerminada ? 'opacity-50' : ''}`}>
              <input
                type="checkbox"
                id="pagarUtilidades"
                checked={pagarUtilidades}
                onChange={(e) => setPagarUtilidades(e.target.checked)}
                className="w-4 h-4"
                disabled={esEmpresaTerminada}
              />
              <label htmlFor="pagarUtilidades" className="text-sm text-neutral-300">
                PAGAR UTILIDADES
              </label>
            </div>
          )}
          
          <div className="flex items-end gap-2">
            {/* Botón Guardar en Lote */}
            <button
              onClick={() => procesarNomina(true)}
              disabled={procesando || esEmpresaTerminada || !empleadoSeleccionadoId}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title={esEmpresaTerminada ? "Empresa terminada - Solo lectura" : !empleadoSeleccionadoId ? "Seleccione un trabajador primero" : ""}
            >
              <Save className="w-4 h-4" />
              {procesando ? "Guardando..." : "Guardar en Lote"}
            </button>
            
            {/* Botón Guardar Todos en Lote */}
            <button
              onClick={guardarEnLoteTodos}
              disabled={procesando || esEmpresaTerminada || empleadosPorEmpresa.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title={esEmpresaTerminada ? "Empresa terminada" : "Guardar todos los empleados en lote"}
            >
              <Users className="w-4 h-4" />
              {procesando ? "..." : "Guardar Todos"}
            </button>
          </div>

          <div className="ml-auto flex items-center gap-4 text-sm">
            <span className="text-neutral-400">Tasa BCV:</span>
            <span className="text-green-400 font-semibold">Bs. {tasaCambio.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Panel de Acciones por Lote - Selección Múltiple */}
      {loteEspera.length > 0 && (
        <div className="bg-neutral-800 rounded-xl border border-purple-600 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-purple-400 font-medium">Selección: {seleccionadosLote.length} empleado(s)</span>
            </div>
            
            {/* Campos de entrada manual para asignaciones/deducciones */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-green-400">Asignación:</label>
              <input
                type="number"
                value={asignacionManualLote}
                onChange={(e) => setAsignacionManualLote(parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-white text-sm"
                placeholder="Monto"
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-red-400">Deducción:</label>
              <input
                type="number"
                value={deduccionManualLote}
                onChange={(e) => setDeduccionManualLote(parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-1 bg-neutral-700 border border-neutral-600 rounded text-white text-sm"
                placeholder="Monto"
                min="0"
                step="0.01"
              />
            </div>
            
            {/* Botón Aplicar a Selección */}
            <button
              onClick={() => {
                if (seleccionadosLote.length === 0) {
                  setError("Seleccione al menos un empleado");
                  return;
                }
                if (asignacionManualLote > 0) {
                  aplicarASeleccion('asignacion', asignacionManualLote);
                }
                if (deduccionManualLote > 0) {
                  aplicarASeleccion('deduccion', deduccionManualLote);
                }
              }}
              disabled={seleccionadosLote.length === 0 || (asignacionManualLote <= 0 && deduccionManualLote <= 0)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckSquare className="w-4 h-4" />
              Aplicar a Selección
            </button>
            
            <button
              onClick={() => setSeleccionadosLote([])}
              className="px-3 py-2 text-neutral-400 hover:text-white text-sm"
            >
              Limpiar Selección
            </button>
          </div>
        </div>
      )}

      {/* Tabla de Lote de Espera */}
      {loteEspera.length > 0 && (
        <div className="bg-neutral-800 rounded-xl border border-amber-600 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
              <Save className="w-5 h-5" />
              Lote de Espera - Empleados Guardados ({loteEspera.length})
            </h3>
            <div className="flex items-center gap-2">
              {/* Botón Procesar Nómina General */}
              <button
                onClick={procesarNominaGeneral}
                disabled={procesando}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                <Calculator className="w-4 h-4" />
                {procesando ? "Procesando..." : "Procesar Nómina de la Empresa"}
              </button>
              
              {/* Botón Limpiar Lote */}
              <button
                onClick={() => {
                  clearLoteEspera();
                  setSuccessMessage("Lote de espera limpiado");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
                Limpiar Lote
              </button>
            </div>
          </div>

          {/* Totales del Lote */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-neutral-700 rounded-lg p-3 text-center">
              <p className="text-xs text-neutral-400">Total Asignaciones</p>
              <p className="text-lg font-bold text-green-400">
                {mostrarEnBs ? `Bs. ${formatearNumero(totalLoteAsignaciones)}` : formatearNumero(totalLoteAsignaciones)}
              </p>
            </div>
            <div className="bg-neutral-700 rounded-lg p-3 text-center">
              <p className="text-xs text-neutral-400">Total Deducciones</p>
              <p className="text-lg font-bold text-red-400">
                {mostrarEnBs ? `Bs. ${formatearNumero(totalLoteDeducciones)}` : formatearNumero(totalLoteDeducciones)}
              </p>
            </div>
            <div className="bg-neutral-700 rounded-lg p-3 text-center">
              <p className="text-xs text-neutral-400">Total Neto</p>
              <p className="text-lg font-bold text-white">
                {mostrarEnBs ? `Bs. ${formatearNumero(totalLoteBs)}` : formatearNumero(totalLoteNeto)}
              </p>
            </div>
            <div className="bg-neutral-700 rounded-lg p-3 text-center">
              <p className="text-xs text-neutral-400">Empleados</p>
              <p className="text-lg font-bold text-blue-400">{loteEspera.length}</p>
            </div>
          </div>

          {/* Tabla de empleados en lote */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-700">
                <tr>
                  <th className="px-2 py-2 text-center text-neutral-300 font-medium">
                    <input 
                      type="checkbox" 
                      checked={seleccionadosLote.length === loteEspera.length && loteEspera.length > 0}
                      onChange={seleccionarTodosLote}
                      className="w-4 h-4 accent-blue-500"
                    />
                  </th>
                  <th className="px-3 py-2 text-left text-neutral-300 font-medium">Cédula</th>
                  <th className="px-3 py-2 text-left text-neutral-300 font-medium">Nombre</th>
                  <th className="px-3 py-2 text-right text-neutral-300 font-medium">Sueldo Base</th>
                  <th className="px-3 py-2 text-right text-neutral-300 font-medium">Asignaciones</th>
                  <th className="px-3 py-2 text-right text-neutral-300 font-medium">Deducciones</th>
                  <th className="px-3 py-2 text-right text-neutral-300 font-medium">Neto Pagar</th>
                  <th className="px-3 py-2 text-center text-neutral-300 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {loteEspera.map((item) => (
                  <tr key={item.empleado_id} className="border-b border-neutral-700 hover:bg-neutral-700/50">
                    <td className="px-2 py-2 text-center">
                      <input 
                        type="checkbox" 
                        checked={seleccionadosLote.includes(item.empleado_id)}
                        onChange={() => toggleSeleccionLote(item.empleado_id)}
                        className="w-4 h-4 accent-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2 text-neutral-300">{item.empleado_cedula}</td>
                    <td className="px-3 py-2 text-white">{item.empleado_nombre}</td>
                    <td className="px-3 py-2 text-right text-neutral-300">
                      {mostrarEnBs 
                        ? `Bs. ${formatearNumero(item.liquidacion.sueldo_base)}`
                        : `$${formatearNumero(item.liquidacion.sueldo_base / tasaCambio)}`
                      }
                    </td>
                    <td className="px-3 py-2 text-right text-green-400">
                      {mostrarEnBs 
                        ? `Bs. ${formatearNumero(item.liquidacion.total_asignaciones)}`
                        : formatearNumero(item.liquidacion.total_asignaciones)
                      }
                    </td>
                    <td className="px-3 py-2 text-right text-red-400">
                      {mostrarEnBs 
                        ? `Bs. ${formatearNumero(item.liquidacion.total_deducciones)}`
                        : formatearNumero(item.liquidacion.total_deducciones)
                      }
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-white">
                      {mostrarEnBs 
                        ? `Bs. ${formatearNumero(item.liquidacion.monto_bs)}`
                        : formatearNumero(item.liquidacion.neto_pagar)
                      }
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => saveIndividualRecord(item.empleado_id)}
                          className="flex items-center gap-1 px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-medium"
                          title="GUARDAR CAMBIOS INDIVIDUAL"
                        >
                          <Save className="w-3 h-3" />
                          GUARDAR
                        </button>
                        <button
                          onClick={() => {
                            setEmpleadoSeleccionadoId(item.empleado_id);
                            setSuccessMessage(`Editando: ${item.empleado_nombre}. Modifique asignaciones/deducciones y guarde en lote.`);
                          }}
                          className="p-1 hover:bg-blue-600 rounded text-neutral-400 hover:text-white"
                          title="Editar empleado"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            removeFromLoteEspera(item.empleado_id);
                            setSuccessMessage("Empleado removido del lote");
                          }}
                          className="p-1 hover:bg-red-600 rounded text-neutral-400 hover:text-white"
                          title="Remover del lote"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conceptos Manuales Dinámicos */}
      <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-6">
        {/* Mensaje de validación si no hay trabajadores */}
        {empleadosPorEmpresa.length === 0 && (
          <div className="mb-4 p-4 bg-yellow-900/30 border border-yellow-600 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
            <div>
              <p className="text-yellow-400 font-semibold">Esta empresa no tiene personal registrado</p>
              <p className="text-yellow-300/70 text-sm">Agregue personal en la sección de Personal antes de procesar la nómina.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2"><Plus className="w-5 h-5" />Asignaciones Adicionales</h3>
              <button 
                onClick={agregarConceptoAsignacion} 
                disabled={esEmpresaTerminada || !empleadoSeleccionadoId}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title={!empleadoSeleccionadoId ? "Seleccione un trabajador primero" : ""}
              >
                <Plus className="w-4 h-4" />Agregar
              </button>
            </div>
            {conceptosAsignaciones.length === 0 ? <p className="text-neutral-500 text-sm italic">Sin conceptos adicionales.</p> : (
              <div className="space-y-3">
                {conceptosAsignaciones.map(c => (
                  <div key={c.id} className={`p-3 bg-neutral-700/50 rounded-lg border ${c.activo ? 'border-green-600/30' : 'border-neutral-600'}`}>
                    <div className="flex items-start gap-2">
                      <input type="checkbox" checked={c.activo} onChange={e => actualizarConceptoAsignacion(c.id, 'activo', e.target.checked)} disabled={esEmpresaTerminada} className="w-4 h-4 mt-1" />
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input type="text" value={c.denominacion} onChange={e => actualizarConceptoAsignacion(c.id, 'denominacion', e.target.value)} placeholder="Denominación" disabled={esEmpresaTerminada} className="px-2 py-1.5 bg-neutral-600 border border-neutral-500 rounded text-white text-sm" />
                        <select value={c.tipo} onChange={e => actualizarConceptoAsignacion(c.id, 'tipo', e.target.value)} disabled={esEmpresaTerminada} className="px-2 py-1.5 bg-neutral-600 border border-neutral-500 rounded text-white text-sm"><option value="MONTO_FIJO">Monto Fijo</option><option value="PORCENTAJE">Porcentaje</option></select>
                        <input type="number" value={c.valor} onChange={e => actualizarConceptoAsignacion(c.id, 'valor', parseFloat(e.target.value) || 0)} placeholder="Valor" disabled={esEmpresaTerminada} className="px-2 py-1.5 bg-neutral-600 border border-neutral-500 rounded text-white text-sm" />
                        <input type="text" value={c.observaciones} onChange={e => actualizarConceptoAsignacion(c.id, 'observaciones', e.target.value)} placeholder="Notas" disabled={esEmpresaTerminada} className="px-2 py-1.5 bg-neutral-600 border border-neutral-500 rounded text-white text-sm" />
                      </div>
                      <button onClick={() => eliminarConceptoAsignacion(c.id)} disabled={esEmpresaTerminada} className="p-1.5 text-red-400 hover:text-red-300 disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2"><Plus className="w-5 h-5" />Deducciones Adicionales</h3>
              <button 
                onClick={agregarConceptoDeduccion} 
                disabled={esEmpresaTerminada || !empleadoSeleccionadoId}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title={!empleadoSeleccionadoId ? "Seleccione un trabajador primero" : ""}
              >
                <Plus className="w-4 h-4" />Agregar
              </button>
            </div>
            {conceptosDeducciones.length === 0 ? <p className="text-neutral-500 text-sm italic">Sin deducciones adicionales.</p> : (
              <div className="space-y-3">
                {conceptosDeducciones.map(c => (
                  <div key={c.id} className={`p-3 bg-neutral-700/50 rounded-lg border ${c.activo ? 'border-red-600/30' : 'border-neutral-600'}`}>
                    <div className="flex items-start gap-2">
                      <input type="checkbox" checked={c.activo} onChange={e => actualizarConceptoDeduccion(c.id, 'activo', e.target.checked)} disabled={esEmpresaTerminada} className="w-4 h-4 mt-1" />
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input type="text" value={c.denominacion} onChange={e => actualizarConceptoDeduccion(c.id, 'denominacion', e.target.value)} placeholder="Denominación" disabled={esEmpresaTerminada} className="px-2 py-1.5 bg-neutral-600 border border-neutral-500 rounded text-white text-sm" />
                        <select value={c.tipo} onChange={e => actualizarConceptoDeduccion(c.id, 'tipo', e.target.value)} disabled={esEmpresaTerminada} className="px-2 py-1.5 bg-neutral-600 border border-neutral-500 rounded text-white text-sm"><option value="MONTO_FIJO">Monto Fijo</option><option value="PORCENTAJE">Porcentaje</option></select>
                        <input type="number" value={c.valor} onChange={e => actualizarConceptoDeduccion(c.id, 'valor', parseFloat(e.target.value) || 0)} placeholder="Valor" disabled={esEmpresaTerminada} className="px-2 py-1.5 bg-neutral-600 border border-neutral-500 rounded text-white text-sm" />
                        <input type="text" value={c.observaciones} onChange={e => actualizarConceptoDeduccion(c.id, 'observaciones', e.target.value)} placeholder="Notas" disabled={esEmpresaTerminada} className="px-2 py-1.5 bg-neutral-600 border border-neutral-500 rounded text-white text-sm" />
                      </div>
                      <button onClick={() => eliminarConceptoDeduccion(c.id)} disabled={esEmpresaTerminada} className="p-1.5 text-red-400 hover:text-red-300 disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* CÁLCULO EN TIEMPO REAL - Neto a Pagar */}
        {empleadoSeleccionadoId && (
          <div className="bg-blue-900/20 border border-blue-600/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5" />Vista Previa - Cálculo en Tiempo Real
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-neutral-800/50 rounded-lg p-4">
                <p className="text-neutral-400 text-sm">Sueldo Base</p>
                <p className="text-2xl font-bold text-white">
                  {empleadoSeleccionado?.tipo_moneda_sueldo === 'USD' 
                    ? `$${empleadoSeleccionado.sueldo_base.toFixed(2)}` 
                    : `Bs. ${empleadoSeleccionado!.sueldo_base.toFixed(2)}`}
                </p>
              </div>
              <div className="bg-green-900/20 rounded-lg p-4 border border-green-600/30">
                <p className="text-green-400 text-sm">Asignaciones Adicionales</p>
                <p className="text-2xl font-bold text-green-400">
                  {empleadoSeleccionado?.tipo_moneda_sueldo === 'USD' 
                    ? `$${calcularTotalConceptosAsignaciones(empleadoSeleccionado.sueldo_base).toFixed(2)}`
                    : `Bs. ${calcularTotalConceptosAsignaciones(empleadoSeleccionado!.sueldo_base).toFixed(2)}`}
                </p>
              </div>
              <div className="bg-red-900/20 rounded-lg p-4 border border-red-600/30">
                <p className="text-red-400 text-sm">Deducciones Adicionales</p>
                <p className="text-2xl font-bold text-red-400">
                  {empleadoSeleccionado?.tipo_moneda_sueldo === 'USD' 
                    ? `$${calcularTotalConceptosDeducciones(empleadoSeleccionado.sueldo_base).toFixed(2)}`
                    : `Bs. ${calcularTotalConceptosDeducciones(empleadoSeleccionado!.sueldo_base).toFixed(2)}`}
                </p>
              </div>
              <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/50">
                <p className="text-blue-300 text-sm">Neto a Pagar (Estimado)</p>
                <p className="text-2xl font-bold text-blue-400">
                  {(() => {
                    const sb = empleadoSeleccionado!.sueldo_base;
                    const asignaciones = calcularTotalConceptosAsignaciones(sb);
                    const deducciones = calcularTotalConceptosDeducciones(sb);
                    return empleadoSeleccionado?.tipo_moneda_sueldo === 'USD'
                      ? `$${(sb + asignaciones - deducciones).toFixed(2)}`
                      : `Bs. ${(sb + asignaciones - deducciones).toFixed(2)}`;
                  })()}
                </p>
              </div>
            </div>
            <p className="text-neutral-400 text-xs mt-3">
              * Este cálculo es una estimación. El monto final se mostrará al procesar la nómina.
            </p>
          </div>
        )}
        {/* Alerta de Tope Legal */}
        {liquidaciones.length > 0 && (() => { const pd = liquidaciones.reduce((s,l) => s + l.total_deducciones, 0) / liquidaciones.length; const psb = liquidaciones.reduce((s,l) => s + l.sueldo_base, 0) / liquidaciones.length; const pct = psb > 0 ? (pd / psb) * 100 : 0; return pct > 50 ? <div className="mt-4 p-4 bg-red-900/30 border border-red-600 rounded-lg flex items-center gap-3"><AlertTriangle className="w-6 h-6 text-red-500" /><div><p className="text-red-400 font-semibold">Advertencia: Las deducciones totales exceden el límite legal permitido</p><p className="text-red-300/70 text-sm">Las deducciones representan el {pct.toFixed(1)}% del salario base (límite: 50%).</p></div></div> : null; })()}
      </div>

      {/* Resultados */}
      {liquidaciones.length > 0 && (
        <div className="space-y-4">
          <div className="bg-neutral-800 rounded-xl border border-neutral-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase">Empleado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-300 uppercase">{mostrarEnBs ? 'Asignaciones (Bs)' : 'Asignaciones ($)'}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-300 uppercase">{mostrarEnBs ? 'Deducciones (Bs)' : 'Deducciones ($)'}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-300 uppercase">{mostrarEnBs ? 'Neto a Pagar (Bs)' : 'Neto a Pagar ($)'}</th>
                  {mostrarEnBs && (
                    <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400 uppercase">Equiv. USD</th>
                  )}
                  <th className="px-4 py-3 text-center text-xs font-medium text-neutral-300 uppercase">Recibo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700">
                {liquidaciones.map((liq, idx) => {
                  const emp = empleados.find(e => e.id === liq.empleado_id);
                  const netoUsd = liq.neto_pagar;
                  const netoBs = liq.monto_bs;
                  const asignacionesUsd = liq.total_asignaciones;
                  const asignacionesBs = liq.total_asignaciones * tasaCambio;
                  const deduccionesUsd = liq.total_deducciones;
                  const deduccionesBs = liq.total_deducciones * tasaCambio;
                  return (
                    <tr key={idx} className="hover:bg-neutral-750">
                      <td className="px-4 py-3 text-white">
                        <div className="font-medium">{emp?.nombre} {emp?.apellido}</div>
                        <div className="text-xs text-neutral-400">{emp?.cedula}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-green-400">
                        {mostrarEnBs ? `Bs. ${asignacionesBs.toFixed(2)}` : `${asignacionesUsd.toFixed(2)}`}
                      </td>
                      <td className="px-4 py-3 text-right text-red-400">
                        {mostrarEnBs ? `Bs. ${deduccionesBs.toFixed(2)}` : `${deduccionesUsd.toFixed(2)}`}
                      </td>
                      <td className="px-4 py-3 text-right text-white font-bold">
                        {mostrarEnBs ? `Bs. ${netoBs.toFixed(2)}` : `${netoUsd.toFixed(2)}`}
                      </td>
                      {mostrarEnBs && (
                        <td className="px-4 py-3 text-right text-neutral-400">
                          ${netoUsd.toFixed(2)}
                        </td>
                      )}
                      <td className="px-4 py-3 text-center">
                        <button 
                          onClick={() => generarReciboPDF(liq)}
                          className="p-1 hover:bg-neutral-600 rounded text-neutral-400 hover:text-white"
                          title="Descargar Recibo"
                        >
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
                  <td className="px-4 py-3 text-right text-green-400">{mostrarEnBs ? `Bs. ${(totalAsignaciones * tasaCambio).toFixed(2)}` : `${totalAsignaciones.toFixed(2)}`}</td>
                  <td className="px-4 py-3 text-right text-red-400">{mostrarEnBs ? `Bs. ${(totalDeducciones * tasaCambio).toFixed(2)}` : `${totalDeducciones.toFixed(2)}`}</td>
                  <td className="px-4 py-3 text-right text-white font-bold">{mostrarEnBs ? `Bs. ${totalBs.toFixed(2)}` : `${totalNeto.toFixed(2)}`}</td>
                  {mostrarEnBs && (
                    <td className="px-4 py-3 text-right text-neutral-400">${totalNeto.toFixed(2)}</td>
                  )}
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
function ReportesView({ empresaId }: { empresaId?: number | null }) {
  const { empleados, empresas, liquidaciones, tasaCambio, setSuccessMessage, empresasPermitidas, puedeVerTodasEmpresas } = useAppStore();
  
  // Obtener empresas permitidas para el selector
  const empresasPermitidasList = puedeVerTodasEmpresas() 
    ? empresas.filter(e => e.id !== 1) 
    : empresas.filter(e => empresasPermitidas.includes(e.id));
  
  const [empresaReporte, setEmpresaReporte] = useState<number>(
    empresaId || (empresasPermitidasList.length > 0 ? empresasPermitidasList[0].id : 2)
  );

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
      // Construir array de asignaciones visibles con suma correcta
      asignaciones: (() => {
        const conceptos: { descripcion: string; monto: number }[] = [];
        if (liquidacion.sueldo_base > 0) conceptos.push({ descripcion: "Sueldo Base", monto: liquidacion.sueldo_base });
        if (liquidacion.bono_vacacional > 0) conceptos.push({ descripcion: "Bono Vacacional", monto: liquidacion.bono_vacacional });
        if (liquidacion.utilidades > 0) conceptos.push({ descripcion: "Utilidades", monto: liquidacion.utilidades });
        if ((liquidacion.bono_transporte || 0) > 0) conceptos.push({ descripcion: "Bono Transporte", monto: liquidacion.bono_transporte || 0 });
        if ((liquidacion.cesta_ticket || 0) > 0) conceptos.push({ descripcion: "Cesta Ticket", monto: liquidacion.cesta_ticket || 0 });
        (liquidacion.conceptos_asignaciones || [])
          .filter((c: ConceptoManual) => c.activo && c.denominacion.trim() !== '' && c.valor > 0)
          .forEach((c: ConceptoManual) => {
            const monto = c.tipo === 'MONTO_FIJO' ? c.valor : liquidacion.sueldo_base * (c.valor / 100);
            if (monto > 0) conceptos.push({ descripcion: c.denominacion, monto });
          });
        return conceptos;
      })(),
      // Construir array de deducciones visibles
      deducciones: (() => {
        const conceptos: { descripcion: string; monto: number }[] = [];
        if (liquidacion.ivss_trabajador > 0) conceptos.push({ descripcion: "IVSS", monto: liquidacion.ivss_trabajador });
        if (liquidacion.rpe_trabajador > 0) conceptos.push({ descripcion: "RPE", monto: liquidacion.rpe_trabajador });
        if (liquidacion.faov_trabajador > 0) conceptos.push({ descripcion: "FAOV", monto: liquidacion.faov_trabajador });
        if (liquidacion.inces_trabajador > 0) conceptos.push({ descripcion: "INCES", monto: liquidacion.inces_trabajador });
        (liquidacion.conceptos_deducciones || [])
          .filter((c: ConceptoManual) => c.activo && c.denominacion.trim() !== '' && c.valor > 0)
          .forEach((c: ConceptoManual) => {
            const monto = c.tipo === 'MONTO_FIJO' ? c.valor : liquidacion.sueldo_base * (c.valor / 100);
            if (monto > 0) conceptos.push({ descripcion: c.denominacion, monto });
          });
        return conceptos;
      })(),
      // Calcular totales como suma de conceptos visibles
      totales: {
        total_asignaciones: (() => {
          const conceptos: number[] = [];
          if (liquidacion.sueldo_base > 0) conceptos.push(liquidacion.sueldo_base);
          if (liquidacion.bono_vacacional > 0) conceptos.push(liquidacion.bono_vacacional);
          if (liquidacion.utilidades > 0) conceptos.push(liquidacion.utilidades);
          if ((liquidacion.bono_transporte || 0) > 0) conceptos.push(liquidacion.bono_transporte || 0);
          if ((liquidacion.cesta_ticket || 0) > 0) conceptos.push(liquidacion.cesta_ticket || 0);
          (liquidacion.conceptos_asignaciones || [])
            .filter((c: ConceptoManual) => c.activo && c.denominacion.trim() !== '' && c.valor > 0)
            .forEach((c: ConceptoManual) => {
              const monto = c.tipo === 'MONTO_FIJO' ? c.valor : liquidacion.sueldo_base * (c.valor / 100);
              if (monto > 0) conceptos.push(monto);
            });
          return conceptos.reduce((a, b) => a + b, 0);
        })(),
        total_deducciones: (() => {
          const conceptos: number[] = [];
          if (liquidacion.ivss_trabajador > 0) conceptos.push(liquidacion.ivss_trabajador);
          if (liquidacion.rpe_trabajador > 0) conceptos.push(liquidacion.rpe_trabajador);
          if (liquidacion.faov_trabajador > 0) conceptos.push(liquidacion.faov_trabajador);
          if (liquidacion.inces_trabajador > 0) conceptos.push(liquidacion.inces_trabajador);
          (liquidacion.conceptos_deducciones || [])
            .filter((c: ConceptoManual) => c.activo && c.denominacion.trim() !== '' && c.valor > 0)
            .forEach((c: ConceptoManual) => {
              const monto = c.tipo === 'MONTO_FIJO' ? c.valor : liquidacion.sueldo_base * (c.valor / 100);
              if (monto > 0) conceptos.push(monto);
            });
          return conceptos.reduce((a: number, b: number) => a + b, 0);
        })(),
        neto_pagar: liquidacion.neto_pagar,
        tasa_cambio: liquidacion.tasa_bcv_oficial || tasaCambio,
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
  const { 
    parametros, 
    setParametros, 
    tasaCambio, 
    setTasaCambio, 
    setSuccessMessage, 
    updateParametros,
    tasaActiva,
    guardarTasaActiva,
    historialTasasActivas,
    cargarHistorialTasas,
    getAuditoriaTasas,
    usuario
  } = useAppStore();
  const [loadingTasa, setLoadingTasa] = useState(false);
  const [editando, setEditando] = useState(false);
  const [formParams, setFormParams] = useState(parametros);
  const [editandoTasaActiva, setEditandoTasaActiva] = useState(false);
  const [tasaActivaEdit, setTasaActivaEdit] = useState(tasaActiva);
  const [anoTasaActiva, setAnoTasaActiva] = useState(new Date().getFullYear());
  const [mesTasaActiva, setMesTasaActiva] = useState(new Date().getMonth() + 1);
  const [mostrarAuditoria, setMostrarAuditoria] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [tasaAnterior, setTasaAnterior] = useState(0);
  const [mostrarHistorialCompleto, setMostrarHistorialCompleto] = useState(false);
  const [tasasAnuales, setTasasAnuales] = useState<any[]>([]);
  const [anoSeleccionado, setAnoSeleccionado] = useState(new Date().getFullYear());

  // Cargar historial al montar
  useEffect(() => {
    cargarHistorialTasas();
    // Generar tasas para el año completo
    generarTasasAnuales(anoSeleccionado);
  }, []);

  // Generar array de tasas para un año completo
  const generarTasasAnuales = (ano: number) => {
    const tasas: any[] = [];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    for (let mes = 1; mes <= 12; mes++) {
      const tasaExistente = historialTasasActivas.find(t => t.ano === ano && t.mes === mes);
      tasas.push({
        ano,
        mes,
        nombreMes: meses[mes - 1],
        tasa: tasaExistente?.tasa || 60.00,
        fuente: tasaExistente?.fuente || 'Automático',
        modificado_por: tasaExistente?.modificado_por || '-',
        fecha_modificacion: tasaExistente?.fecha_modificacion || '-'
      });
    }
    setTasasAnuales(tasas);
  };

  // Actualizar tasas anuales cuando cambia el año o el historial
  useEffect(() => {
    generarTasasAnuales(anoSeleccionado);
  }, [anoSeleccionado, historialTasasActivas]);

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

  const handleGuardarParams = () => {
    updateParametros(formParams);
    setSuccessMessage("Parámetros guardados correctamente");
    setEditando(false);
  };

  const handleGuardarTasaActiva = () => {
    // Buscar si ya existe una tasa para ese mes/año
    const tasaExistente = historialTasasActivas.find(t => t.ano === anoTasaActiva && t.mes === mesTasaActiva);
    setTasaAnterior(tasaExistente?.tasa || 0);
    setMostrarConfirmacion(true);
  };

  const confirmarGuardadoTasa = (motivo?: string) => {
    const usuario = useAppStore.getState().usuario;
    guardarTasaActiva(anoTasaActiva, mesTasaActiva, tasaActivaEdit, `Tasa Activa ${mesTasaActiva}/${anoTasaActiva}`);
    setSuccessMessage(`Tasa activa ${tasaActivaEdit.toFixed(2)}% guardada para ${mesTasaActiva}/${anoTasaActiva}${tasaAnterior !== 0 && tasaAnterior !== tasaActivaEdit ? ' - Se debe recalcular prestaciones' : ''}`);
    setEditandoTasaActiva(false);
    setMostrarConfirmacion(false);
    generarTasasAnuales(anoSeleccionado);
  };

  const handleEditarTasaMensual = (mes: number, nuevaTasa: number) => {
    const tasaExistente = historialTasasActivas.find(t => t.ano === anoSeleccionado && t.mes === mes);
    setTasaAnterior(tasaExistente?.tasa || 0);
    setAnoTasaActiva(anoSeleccionado);
    setMesTasaActiva(mes);
    setTasaActivaEdit(nuevaTasa);
    setEditandoTasaActiva(true);
    setMostrarConfirmacion(true);
  };

  const auditoria = getAuditoriaTasas();

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

        {/* Tasa Activa para Prestaciones - Historia Anual */}
        <div className="bg-neutral-800 rounded-xl p-6 border border-yellow-600/30 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-yellow-400" />
              Configuración de Tasas Activas (LOTTT)
            </h3>
            <button
              onClick={() => setMostrarAuditoria(!mostrarAuditoria)}
              className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded-lg text-sm"
            >
              {mostrarAuditoria ? 'Ocultar Auditoría' : 'Ver Auditoría'}
            </button>
          </div>
          
          {/* Selector de Año */}
          <div className="flex items-center gap-4 mb-4">
            <div>
              <label className="text-sm text-neutral-400">Año Fiscal:</label>
              <select
                value={anoSeleccionado}
                onChange={(e) => setAnoSeleccionado(parseInt(e.target.value))}
                className="ml-2 px-3 py-1.5 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
              >
                {[2024, 2025, 2026].map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="text-sm text-neutral-400">
              Tasa Actual: <span className="text-yellow-400 font-bold">{tasaActiva.toFixed(2)}%</span>
            </div>
          </div>
          
          {/* Tabla de Tasas del Año */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-700">
                <tr>
                  <th className="px-3 py-2 text-left text-neutral-300">Mes</th>
                  <th className="px-3 py-2 text-right text-neutral-300">Tasa (%)</th>
                  <th className="px-3 py-2 text-center text-neutral-300">Fuente</th>
                  <th className="px-3 py-2 text-center text-neutral-300">Última Modificación</th>
                  <th className="px-3 py-2 text-center text-neutral-300">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700">
                {tasasAnuales.map((t) => (
                  <tr key={t.mes} className="hover:bg-neutral-750">
                    <td className="px-3 py-2 text-white">{t.nombreMes}</td>
                    <td className="px-3 py-2 text-right text-yellow-400 font-medium">{t.tasa.toFixed(2)}%</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 text-xs rounded ${t.fuente === 'Manual' ? 'bg-blue-600/20 text-blue-400' : 'bg-green-600/20 text-green-400'}`}>
                        {t.fuente}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-neutral-400 text-xs">
                      {t.modificado_por !== '-' ? (
                        <div>{t.modificado_por}</div>
                      ) : '-'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => handleEditarTasaMensual(t.mes, t.tasa)}
                        className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded"
                        title="Editar tasa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sección de Auditoría */}
          {mostrarAuditoria && (
            <div className="mt-4 p-4 bg-neutral-700/50 rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-2">Historial de Cambios</h4>
              {auditoria.length > 0 ? (
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {auditoria.slice(0, 10).map((a, idx) => (
                    <div key={idx} className="flex justify-between text-xs p-2 bg-neutral-700 rounded">
                      <span className="text-neutral-400">
                        {a.mes.toString().padStart(2, '0')}/{a.ano} - {a.usuario}
                      </span>
                      <span className="text-red-400">{a.tasa_anterior.toFixed(2)}% → </span>
                      <span className="text-green-400">{a.tasa_nueva.toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-400 text-sm">No hay cambios registrados</p>
              )}
            </div>
          )}
        </div>

        {/* Parámetros Salariales */}
        <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Parámetros Salariales</h3>
            <button
              onClick={() => { setEditando(!editando); setFormParams(parametros); }}
              className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded"
              title={editando ? "Cancelar" : "Editar"}
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Salario Mínimo (Bs)</span>
              {editando ? (
                <input
                  type="number"
                  value={formParams.salario_minimo}
                  onChange={(e) => setFormParams({ ...formParams, salario_minimo: parseFloat(e.target.value) })}
                  className="w-32 px-3 py-1 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-right"
                  step="0.01"
                />
              ) : (
                <span className="text-white font-semibold">Bs. {parametros.salario_minimo.toFixed(2)}</span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Tipo de Moneda</span>
              {editando ? (
                <select
                  value={formParams.tipo_moneda}
                  onChange={(e) => setFormParams({ ...formParams, tipo_moneda: e.target.value as 'USD' | 'VES' })}
                  className="w-32 px-3 py-1 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                >
                  <option value="USD">USD - Dólar</option>
                  <option value="VES">VES - Bolívar</option>
                </select>
              ) : (
                <span className="text-white font-semibold">{parametros.tipo_moneda}</span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Bono Transporte (2da Quincena)</span>
              {editando ? (
                <input
                  type="number"
                  value={formParams.bono_transporte}
                  onChange={(e) => setFormParams({ ...formParams, bono_transporte: parseFloat(e.target.value) })}
                  className="w-32 px-3 py-1 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-right"
                  step="0.01"
                />
              ) : (
                <span className="text-white font-semibold">${parametros.bono_transporte.toFixed(2)}</span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Cesta Ticket (2da Quincena)</span>
              {editando ? (
                <input
                  type="number"
                  value={formParams.cesta_ticket}
                  onChange={(e) => setFormParams({ ...formParams, cesta_ticket: parseFloat(e.target.value) })}
                  className="w-32 px-3 py-1 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-right"
                  step="0.01"
                />
              ) : (
                <span className="text-white font-semibold">${parametros.cesta_ticket.toFixed(2)}</span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Período Actual</span>
              <span className="text-white font-semibold">{parametros.mes}/{parametros.ano}</span>
            </div>
            
            {editando && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleGuardarParams}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
                <button
                  onClick={() => { setEditando(false); setFormParams(parametros); }}
                  className="px-4 py-2 bg-neutral-700 text-white rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            )}
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

      {/* Modal de Confirmación para Cambio de Tasa */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 rounded-xl p-6 max-w-md w-full mx-4 border border-yellow-600">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-yellow-600/20 rounded-full">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Advertencia</h3>
                <p className="text-sm text-neutral-400">Cambio de Tasa Activa</p>
              </div>
            </div>
            
            <div className="bg-neutral-700/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-neutral-300 mb-2">
                Está a punto de modificar la tasa activa para el período:
              </p>
              <div className="flex justify-between items-center mb-2">
                <span className="text-neutral-400">Mes/Año:</span>
                <span className="text-white font-medium">{mesTasaActiva}/{anoTasaActiva}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-neutral-400">Tasa Anterior:</span>
                <span className="text-red-400 font-medium">{tasaAnterior.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Nueva Tasa:</span>
                <span className="text-green-400 font-medium">{tasaActivaEdit.toFixed(2)}%</span>
              </div>
            </div>
            
            <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-400">
                ⚠️ Esta acción modificará los cálculos de intereses de prestaciones de meses anteriores. ¿Desea continuar?
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmarGuardadoTasa()}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium"
              >
                Confirmar Cambio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// VISTA: CONTABILIDAD
// ============================================================
function ContabilidadView({ empresaId }: { empresaId?: number | null }) {
  const { empleados, empresas, liquidaciones, tasaCambio, setSuccessMessage, setError, tasaActiva, obtenerTasaActivaParaCalculo, empresasPermitidas, puedeVerTodasEmpresas } = useAppStore();
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [procesando, setProcesando] = useState(false);
  const [mostrarEnBs, setMostrarEnBs] = useState(true);
  
  // Obtener empresas permitidas
  const empresasPermitidasList = puedeVerTodasEmpresas() 
    ? empresas.filter(e => e.id !== 1) 
    : empresas.filter(e => empresasPermitidas.includes(e.id));
  
  const empresaDefault = empresaId || (empresasPermitidasList.length > 0 ? empresasPermitidasList[0].id : 2);
  const [empresaContabilidad, setEmpresaContabilidad] = useState<number>(empresaDefault);

  // Filtrar empleados activos por empresa y permisos
  const empleadosActivos = empleados.filter(e => {
    const tienePermiso = puedeVerTodasEmpresas() || empresasPermitidas.includes(e.empresa_id);
    return e.estatus === 'ACTIVO' && e.empresa_id !== 1 && tienePermiso;
  });
  
  // Calcular provisiones laborales
  const calcularProvisiones = () => {
    const nominaTotal = empleadosActivos.reduce((sum, e) => { const monto = e.tipo_moneda_sueldo === "USD" ? e.sueldo_base : e.sueldo_base / tasaCambio; return sum + monto; }, 0);
    const diarioSueldo = nominaTotal / 30;
    
    // Obtener tasa activa del mes (busca en historial o usa la actual)
    const tasaDelMes = obtenerTasaActivaParaCalculo(ano, mes);
    const tasaActivaDecimal = tasaDelMes / 100;
    
    // Garantía de Prestaciones (Art. 142a): 15 días por trimestre
    const garantia = (diarioSueldo * 15) / 3; // Trimestral
    
    // Intereses sobre Prestaciones (tasa activa BCV)
    const intereses = garantia * tasaActivaDecimal / 4; // Trimestral
    
    // Alícuota de Utilidades (30 días)
    const utilidades = diarioSueldo * 30 / 12; // Mensual
    
    // Alícuota de Bono Vacacional (según antigüedad)
    const bonoVacacional = diarioSueldo * 15 / 12; // Promedio
    
    return {
      garantia: Math.round(garantia * 100) / 100,
      intereses: Math.round(intereses * 100) / 100,
      utilidades: Math.round(utilidades * 100) / 100,
      bonoVacacional: Math.round(bonoVacacional * 100) / 100,
      tasaActiva: tasaDelMes
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
  
  // Totales en BS cuando switch está activo
  const totalNetoBs = totalNeto * tasaCambio;
  const totalIvssBs = totalIvss * tasaCambio;
  const totalFaovBs = totalFaov * tasaCambio;
  const totalRpeBs = totalRpe * tasaCambio;
  const totalProvisionesBs = totalProvisiones * tasaCambio;
  const totalAsignacionesBs = liquidaciones.reduce((s, l) => s + l.total_asignaciones, 0) * tasaCambio;
  const totalEgresosBs = (totalNeto + totalIvss + totalFaov + totalRpe) * tasaCambio;

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Contabilidad y Provisiones</h2>
          <p className="text-neutral-400">Asientos contables y provisiones laborales LOTTT</p>
        </div>
        
        {/* Selector de Moneda */}
        <div className="flex items-center gap-2 bg-neutral-800 rounded-lg p-1 border border-neutral-700">
          <button
            onClick={() => setMostrarEnBs(false)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              !mostrarEnBs 
                ? 'bg-blue-600 text-white' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            USD
          </button>
          <button
            onClick={() => setMostrarEnBs(true)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mostrarEnBs 
                ? 'bg-green-600 text-white' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            BS
          </button>
        </div>
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
              <span className="text-white font-medium">{mostrarEnBs ? `Bs. ${(provisiones.garantia * tasaCambio).toFixed(2)}` : `${provisiones.garantia.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between p-3 bg-neutral-700 rounded-lg">
              <span className="text-neutral-300">Intereses sobre PS</span>
              <span className="text-white font-medium">{mostrarEnBs ? `Bs. ${(provisiones.intereses * tasaCambio).toFixed(2)}` : `${provisiones.intereses.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between p-3 bg-neutral-700 rounded-lg">
              <span className="text-neutral-300">Alícuota Utilidades</span>
              <span className="text-white font-medium">{mostrarEnBs ? `Bs. ${(provisiones.utilidades * tasaCambio).toFixed(2)}` : `${provisiones.utilidades.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between p-3 bg-neutral-700 rounded-lg">
              <span className="text-neutral-300">Alícuota Bono Vacacional</span>
              <span className="text-white font-medium">{mostrarEnBs ? `Bs. ${(provisiones.bonoVacacional * tasaCambio).toFixed(2)}` : `${provisiones.bonoVacacional.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between p-3 bg-purple-600/20 rounded-lg border border-purple-600">
              <span className="text-white font-bold">TOTAL PROVISIONES</span>
              <span className="text-purple-400 font-bold">{mostrarEnBs ? `Bs. ${totalProvisionesBs.toFixed(2)}` : `${totalProvisiones.toFixed(2)}`}</span>
            </div>
            {mostrarEnBs && (
              <div className="flex justify-between p-2 bg-neutral-700/50 rounded-lg text-xs">
                <span className="text-neutral-400">Equivalente en USD:</span>
                <span className="text-neutral-300">${totalProvisiones.toFixed(2)}</span>
              </div>
            )}
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
              <span className="text-green-400 font-medium">{mostrarEnBs ? `Bs. ${totalNetoBs.toFixed(2)}` : `${totalNeto.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between p-3 bg-neutral-700 rounded-lg">
              <span className="text-neutral-300">IVSS</span>
              <span className="text-red-400 font-medium">{mostrarEnBs ? `Bs. ${totalIvssBs.toFixed(2)}` : `${totalIvss.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between p-3 bg-neutral-700 rounded-lg">
              <span className="text-neutral-300">FAOV</span>
              <span className="text-red-400 font-medium">{mostrarEnBs ? `Bs. ${totalFaovBs.toFixed(2)}` : `${totalFaov.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between p-3 bg-neutral-700 rounded-lg">
              <span className="text-neutral-300">RPE</span>
              <span className="text-red-400 font-medium">{mostrarEnBs ? `Bs. ${totalRpeBs.toFixed(2)}` : `${totalRpe.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between p-3 bg-neutral-700 rounded-lg">
              <span className="text-neutral-300">INCES Patronal</span>
              <span className="text-red-400 font-medium">{mostrarEnBs ? `Bs. ${(totalIncesPatronal * tasaCambio).toFixed(2)}` : `${totalIncesPatronal.toFixed(2)}`}</span>
            </div>
            {mostrarEnBs && (
              <div className="flex justify-between p-2 bg-neutral-700/50 rounded-lg text-xs">
                <span className="text-neutral-400">Total USD:</span>
                <span className="text-neutral-300">${totalNeto.toFixed(2)}</span>
              </div>
            )}
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
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-300 uppercase">{mostrarEnBs ? 'Debe (BS)' : 'Debe (USD)'}</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-300 uppercase">{mostrarEnBs ? 'Haber (BS)' : 'Haber (USD)'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-700">
            <tr>
              <td className="px-4 py-3 text-white font-medium">Gasto de Sueldos</td>
              <td className="px-4 py-3 text-right text-green-400">{mostrarEnBs ? `Bs. ${totalAsignacionesBs.toFixed(2)}` : `${liquidaciones.reduce((s, l) => s + l.total_asignaciones, 0).toFixed(2)}`}</td>
              <td className="px-4 py-3 text-right">-</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-white font-medium">Bancos</td>
              <td className="px-4 py-3 text-right">-</td>
              <td className="px-4 py-3 text-right text-red-400">{mostrarEnBs ? `Bs. ${totalNetoBs.toFixed(2)}` : `${totalNeto.toFixed(2)}`}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-white font-medium">IVSS por Pagar</td>
              <td className="px-4 py-3 text-right">-</td>
              <td className="px-4 py-3 text-right text-red-400">{mostrarEnBs ? `Bs. ${totalIvssBs.toFixed(2)}` : `${totalIvss.toFixed(2)}`}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-white font-medium">FAOV por Pagar</td>
              <td className="px-4 py-3 text-right">-</td>
              <td className="px-4 py-3 text-right text-red-400">{mostrarEnBs ? `Bs. ${totalFaovBs.toFixed(2)}` : `${totalFaov.toFixed(2)}`}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-white font-medium">RPE por Pagar</td>
              <td className="px-4 py-3 text-right">-</td>
              <td className="px-4 py-3 text-right text-red-400">{mostrarEnBs ? `Bs. ${totalRpeBs.toFixed(2)}` : `${totalRpe.toFixed(2)}`}</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-white font-medium">Provisiones Laborales</td>
              <td className="px-4 py-3 text-right text-green-400">{mostrarEnBs ? `Bs. ${totalProvisionesBs.toFixed(2)}` : `${totalProvisiones.toFixed(2)}`}</td>
              <td className="px-4 py-3 text-right">-</td>
            </tr>
          </tbody>
          <tfoot className="bg-neutral-700 font-bold">
            <tr>
              <td className="px-4 py-3 text-white">TOTALES</td>
              <td className="px-4 py-3 text-right text-green-400">{mostrarEnBs ? `Bs. ${(totalAsignacionesBs + totalProvisionesBs).toFixed(2)}` : `${(liquidaciones.reduce((s, l) => s + l.total_asignaciones, 0) + totalProvisiones).toFixed(2)}`}</td>
              <td className="px-4 py-3 text-right text-red-400">{mostrarEnBs ? `Bs. ${totalEgresosBs.toFixed(2)}` : `${(totalNeto + totalIvss + totalFaov + totalRpe).toFixed(2)}`}</td>
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
