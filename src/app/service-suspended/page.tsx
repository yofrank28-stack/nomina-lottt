"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useAppStore from "../../lib/store";
import { generarExpedienteFinalPDF, descargarPDF, DatosExpedienteFinal } from "../../lib/pdf-generator";
import {
  AlertTriangle,
  CreditCard,
  Phone,
  Mail,
  Building2,
  LogOut,
  Lock,
  Download,
  MessageCircle
} from "lucide-react";

// ============================================================
// VARIABLES DE ENTORNO PARA DATOS DE CONTACTO DEL ADMIN
// ============================================================
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
const ADMIN_TELEFONO = process.env.NEXT_PUBLIC_ADMIN_TELEFONO || "";
const ADMIN_ZELLE = process.env.NEXT_PUBLIC_ADMIN_ZELLE || "";
const ADMIN_ZINLI = process.env.NEXT_PUBLIC_ADMIN_ZINLI || "";
const ADMIN_PAGO_MOVIL = process.env.NEXT_PUBLIC_ADMIN_PAGO_MOVIL || "";
const ADMIN_BANCO = process.env.NEXT_PUBLIC_ADMIN_BANCO || "";
const ADMIN_CUENTA = process.env.NEXT_PUBLIC_ADMIN_CUENTA || "";
const ADMIN_WHATSAPP = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "";
const MENSAJE_SUSPENDIDO = process.env.NEXT_PUBLIC_MENSAJE_SUSPENDIDO || "Su suscripción ha vencido o el servicio ha sido pausado por el administrador.";

// Zinli tiene prioridad sobre Zelle
const HAY_DATOS_PAGO = !!(ADMIN_ZINLI || ADMIN_ZELLE || ADMIN_PAGO_MOVIL || ADMIN_BANCO);

export default function ServiceSuspendedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const empresaId = searchParams.get("empresa");
  
  const { empresas, logout, usuario, empleados, liquidaciones, marcarExpedienteDescargado, tasaCambio } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Buscar la empresa directamente del store
  const empresa = empresaId ? empresas.find(e => e.id === parseInt(empresaId)) : null;
  
  // Determinar si debe mostrar la página
  const debeMostrarPagina = !!(empresa && 
    usuario?.rol !== 'MASTER' && 
    (empresa.status === 'suspended' || empresa.status === 'terminated'));

  // Redireccionar si es admin master o empresa no está suspendida/terminada
  useEffect(() => {
    if (usuario?.rol === 'MASTER') {
      router.push('/');
      return;
    }

    if (!empresaId || !empresa) {
      return;
    }

    // Verificar que realmente esté suspendida
    if (empresa.status !== 'suspended' && empresa.status !== 'terminated') {
      router.push('/');
    }
    
    setIsLoading(false);
  }, [empresaId, empresa, usuario, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const generarExpedienteFinal = async () => {
    if (!empresa) return;
    
    setIsGenerating(true);
    
    try {
      // Filtrar empleados y liquidaciones de esta empresa
      const empleadosEmpresa = empleados.filter(e => e.empresa_id === empresa.id);
      const liquidacionesEmpresa = liquidaciones.filter(l => l.empresa_id === empresa.id);
      
      // Calcular provisiones (ejemplo simplificado)
      const sumaSueldos = empleadosEmpresa.reduce((sum, e) => sum + (e.sueldo_base || 0), 0);
      const provisiones = {
        garantia_prestaciones: sumaSueldos * 0.05, // 5% ejemplo
        intereses_prestaciones: sumaSueldos * 0.02, // 2% ejemplo
        bono_vacacional: sumaSueldos * 0.03, // 3% ejemplo
        utilidades: sumaSueldos * 0.04 // 4% ejemplo
      };
      
      // Preparar datos para el PDF
      const datosExpediente: DatosExpedienteFinal = {
        empresa: {
          nombre: empresa.nombre,
          rif: empresa.rif,
          direccion: empresa.direccion,
          telefono: empresa.telefono,
          email: empresa.email,
          fecha_cierre: empresa.fecha_terminacion || new Date().toISOString().split('T')[0]
        },
        empleados: empleadosEmpresa.map(e => ({
          cedula: e.cedula,
          nombre: e.nombre,
          apellido: e.apellido || '',
          cargo: e.cargo || '',
          fecha_ingreso: e.fecha_ingreso,
          fecha_egreso: e.fecha_egreso,
          sueldo_base: e.sueldo_base || 0,
          tipo_moneda: e.tipo_moneda_sueldo || 'USD',
          estatus: e.estatus
        })),
        liquidaciones: liquidacionesEmpresa.map(l => ({
          ano: l.ano,
          mes: l.mes,
          quincena: l.quincena,
          total_neto: l.neto_pagar || 0,
          total_asignaciones: l.total_asignaciones || 0,
          total_deducciones: l.total_deducciones || 0
        })),
        provisiones: provisiones,
        tasa_cambio: tasaCambio
      };
      
      // Generar y descargar PDF
      const doc = generarExpedienteFinalPDF(datosExpediente);
      descargarPDF(doc, `expediente_final_${empresa.rif}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      // Marcar como descargado
      marcarExpedienteDescargado(empresa.id);
      
    } catch (error) {
      console.error('Error generando expediente:', error);
      alert('Error al generar el expediente. Intente de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si no debe mostrar la página, retornar null
  if (!debeMostrarPagina) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col">
      {/* Header */}
      <header className="bg-neutral-800 border-b border-neutral-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-red-600 rounded-lg">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Nómina Venezuela</h1>
              <p className="text-xs text-neutral-400">Sistema de Gestión de Nómina</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Bloqueo Principal */}
          <div className="bg-neutral-800 rounded-2xl p-8 border border-red-900/50">
            {/* Icono de Bloqueo */}
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-600/20 rounded-full">
                <AlertTriangle className="w-16 h-16 text-red-500" />
              </div>
            </div>

            {/* Mensaje de Bloqueo */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {empresa?.status === 'terminated' ? 'Empresa Terminada' : 'Servicio Suspendido'}
              </h2>
              <p className="text-neutral-400">
                {empresa?.status === 'terminated' 
                  ? "Esta empresa ha sido terminada. El acceso al sistema ha sido cerrado."
                  : MENSAJE_SUSPENDIDO
                }
              </p>
              {empresa && (
                <p className="text-neutral-500 mt-2">
                  Empresa: <span className="text-white font-medium">{empresa.nombre}</span>
                  <span className="ml-2 text-sm">({empresa.rif})</span>
                </p>
              )}
            </div>

            {/* Estado Terminada - Solo descargar expediente */}
            {empresa?.status === 'terminated' && (
              <div className="mb-8 p-6 bg-neutral-700/50 rounded-xl border border-neutral-600">
                <div className="text-center">
                  <p className="text-neutral-300 mb-4">
                    La empresa ha sido terminada. A continuación puede descargar el expediente final.
                  </p>
                  {empresa.expediente_descargado ? (
                    <div className="flex items-center justify-center gap-2 text-neutral-500">
                      <Lock className="w-5 h-5" />
                      <span>El expediente ya fue descargado. Acceso cerrado.</span>
                    </div>
                  ) : (
                    <button 
                      onClick={generarExpedienteFinal}
                      disabled={isGenerating}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Generando...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          Descargar Expediente Final
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Estado Suspendido - Sección de Pagos */}
            {empresa?.status === 'suspended' && (
              <div className="space-y-6">
                {/* Métodos de Pago (Desde Variables de Entorno) */}
                {HAY_DATOS_PAGO && (
                  <div className="bg-neutral-700/50 rounded-xl p-6 border border-neutral-600">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-green-400" />
                      {ADMIN_ZINLI ? 'Pago vía Zinli' : 'Métodos de Pago para Renovación'}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Zinli - PRIORIZADO */}
                      {ADMIN_ZINLI && (
                        <div className="bg-neutral-800 p-4 rounded-lg border border-green-500/50">
                          <p className="text-sm text-green-400 mb-1">Zinli</p>
                          <p className="text-white font-medium">{ADMIN_ZINLI}</p>
                        </div>
                      )}

                      {/* Zelle */}
                      {ADMIN_ZELLE && (
                        <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-600">
                          <p className="text-sm text-neutral-400 mb-1">Zelle</p>
                          <p className="text-white font-medium">{ADMIN_ZELLE}</p>
                        </div>
                      )}

                      {/* Pago Móvil */}
                      {ADMIN_PAGO_MOVIL && (
                        <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-600">
                          <p className="text-sm text-neutral-400 mb-1">Pago Móvil</p>
                          <p className="text-white font-medium">{ADMIN_PAGO_MOVIL}</p>
                        </div>
                      )}

                      {/* Transferencia */}
                      {(ADMIN_BANCO || ADMIN_CUENTA) && (
                        <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-600">
                          <p className="text-sm text-neutral-400 mb-1">Transferencia</p>
                          <p className="text-white font-medium">{ADMIN_BANCO}</p>
                          <p className="text-neutral-400 text-sm">
                            Cuenta: {ADMIN_CUENTA}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Información de Contacto */}
                <div className="bg-neutral-700/50 rounded-xl p-6 border border-neutral-600">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-blue-400" />
                    Contacto del Administrador
                  </h3>
                  
                  <div className="space-y-3">
                    {ADMIN_EMAIL && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-neutral-400" />
                        <a 
                          href={`mailto:${ADMIN_EMAIL}`}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          {ADMIN_EMAIL}
                        </a>
                      </div>
                    )}
                    {ADMIN_TELEFONO && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-neutral-400" />
                        <a 
                          href={`tel:${ADMIN_TELEFONO}`}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          {ADMIN_TELEFONO}
                        </a>
                      </div>
                    )}
                    {ADMIN_WHATSAPP && (
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-5 h-5 text-green-400" />
                        <a 
                          href={`https://wa.me/${ADMIN_WHATSAPP.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-400 hover:text-green-300"
                        >
                          WhatsApp
                        </a>
                      </div>
                    )}
                    {(!ADMIN_EMAIL && !ADMIN_TELEFONO && !ADMIN_WHATSAPP) && (
                      <p className="text-neutral-500">Contacte al administrador del sistema para más información.</p>
                    )}
                  </div>
                </div>

                {/* Información Adicional */}
                <div className="text-center text-neutral-500 text-sm">
                  <p>Una vez realizado el pago, el servicio será restaurado en un máximo de 24 horas.</p>
                  <p className="mt-1">¿Necesita ayuda? Contacte al administrador master.</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-neutral-500 text-sm">
            <p>© {new Date().getFullYear()} Nómina Venezuela - Sistema LOTTT</p>
          </div>
        </div>
      </main>
    </div>
  );
}
