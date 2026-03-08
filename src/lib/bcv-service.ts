// ============================================================
// SERVICIO BCV - Banco Central de Venezuela
// Obtención de tasa de cambio oficial del dólar
// y tasa activa para prestaciones sociales
// Incluye historial de tasas para cálculos legales
// ============================================================

export interface TasaBCV {
  fecha: string;
  precio: number;
  moneda: string;
  simbolo: string;
}

// Tasa activa BCV para calcular prestaciones sociales (Artículo 142 LOTTT)
// Esta es la tasa de interés que se usa para calcular los intereses sobre prestaciones sociales
export interface TasaActivaBCV {
  fecha: string;
  tasa: number;  // Porcentaje anual
  descripcion: string;
}

// Historial de tasa de cambio
export interface HistoricoTasaCambio {
  id?: number;
  fecha: string;
  precio_venta: number;
  moneda: string;
  fuente: string;
}

// Historial de tasa activa
export interface HistoricoTasaActiva {
  id?: number;
  ano: number;
  mes: number;
  tasa: number;
  descripcion: string;
  fuente: string;
}

// Almacenamiento en memoria (en producción sería base de datos)
let historialTasasCambio: HistoricoTasaCambio[] = [];
let historialTasasActivas: HistoricoTasaActiva[] = [];

// URLs del BCV para obtener tasas de cambio
const BCV_API_URL = 'https://www.bcv.org.ve/servicios/recurso';

// Función para obtener la tasa activa del BCV
export async function obtenerTasaActiva(): Promise<TasaActivaBCV> {
  // Primero buscar en el historial
  const now = new Date();
  const tasaHistorica = historialTasasActivas.find(
    t => t.ano === now.getFullYear() && t.mes === now.getMonth() + 1
  );
  
  if (tasaHistorica) {
    return {
      fecha: `${tasaHistorica.ano}-${String(tasaHistorica.mes).padStart(2, '0')}-01`,
      tasa: tasaHistorica.tasa,
      descripcion: tasaHistorica.descripcion
    };
  }
  
  try {
    // La tasa activa del BCV se publica en su sitio web
    // Por defecto usamos la tasa activa promedio (~60% anual)
    // que es la tasa que se usa para calcular intereses sobre prestaciones
    return {
      fecha: new Date().toISOString().split('T')[0],
      tasa: 60.00, // Tasa activa promedio BCV (~60% anual)
      descripcion: 'Tasa Activa Promedio BCV'
    };
  } catch (error) {
    console.warn('BCV tasa activa no disponible:', error);
    
    // Tasa activa default para Venezuela
    return {
      fecha: new Date().toISOString().split('T')[0],
      tasa: 60.00,
      descripcion: 'Tasa Activa (Fallback)'
    };
  }
}

// Obtener tasa activa con fallback
export async function getTasaActiva(): Promise<TasaActivaBCV> {
  try {
    return await obtenerTasaActiva();
  } catch {
    return {
      fecha: new Date().toISOString().split('T')[0],
      tasa: 60.00,
      descripcion: 'Tasa Activa (Fallback)'
    };
  }
}

// Guardar tasa activa en historial
export function guardarTasaActiva(
  ano: number, 
  mes: number, 
  tasa: number, 
  descripcion: string = 'Tasa Activa BCV'
): void {
  const existente = historialTasasActivas.findIndex(
    t => t.ano === ano && t.mes === mes
  );
  
  const nuevaTasa: HistoricoTasaActiva = {
    ano,
    mes,
    tasa,
    descripcion,
    fuente: 'Manual'
  };
  
  if (existente >= 0) {
    historialTasasActivas[existente] = nuevaTasa;
  } else {
    historialTasasActivas.push(nuevaTasa);
  }
}

// Obtener tasa activa para un mes específico (para cálculos de prestaciones)
export function getTasaActivaPorMes(ano: number, mes: number): number {
  // Buscar tasa exacta del mes
  const tasa = historialTasasActivas.find(
    t => t.ano === ano && t.mes === mes
  );
  
  if (tasa) {
    return tasa.tasa;
  }
  
  // Si no existe, buscar la última tasa disponible anterior al mes
  // Ordenar por fecha descendente
  const tasasAnteriores = historialTasasActivas
    .filter(t => t.ano < ano || (t.ano === ano && t.mes < mes))
    .sort((a, b) => {
      if (a.ano !== b.ano) return b.ano - a.ano;
      return b.mes - a.mes;
    });
  
  if (tasasAnteriores.length > 0) {
    return tasasAnteriores[0].tasa;
  }
  
  // Default si no hay historial
  return 60.00;
}

// Obtener todas las tasas activas del historial
export function getHistorialTasasActivas(): HistoricoTasaActiva[] {
  return [...historialTasasActivas].sort((a, b) => {
    if (a.ano !== b.ano) return b.ano - a.ano;
    return b.mes - a.mes;
  });
}

export async function obtenerTasaCambio(): Promise<TasaBCV> {
  try {
    // Intentar obtener del BCV
    const response = await fetch(BCV_API_URL, {
      next: { revalidate: 300 } // Cache por 5 minutos
    });
    
    if (!response.ok) {
      throw new Error('Error al conectar con BCV');
    }
    
    const html = await response.text();
    
    // Extraer el valor del dólar del HTML
    const usdPriceMatch = html.match(/<div class="price">\s*([\d.,]+)\s*<\/div>/i);
    
    if (usdPriceMatch && usdPriceMatch[1]) {
      const precio = parseFloat(usdPriceMatch[1].replace(',', '.'));
      
      return {
        fecha: new Date().toISOString().split('T')[0],
        precio: precio,
        moneda: 'USD',
        simbolo: '$'
      };
    }
    
    // Si no se puede parsear, usar fallback
    throw new Error('No se pudo extraer la tasa');
  } catch (error) {
    console.warn('BCV no disponible, usando tasa de fallback:', error);
    
    // Tasa fallback para desarrollo
    return {
      fecha: new Date().toISOString().split('T')[0],
      precio: 36.15, // Tasa aproximada
      moneda: 'USD',
      simbolo: '$'
    };
  }
}

// Función alternativa usando scraping público
export async function obtenerTasaCambioAlt(): Promise<TasaBCV> {
  try {
    const response = await fetch(
      'https://api.exchange-rate-api.com/v4/latest/USD',
      { next: { revalidate: 300 } }
    );
    
    if (!response.ok) {
      throw new Error('API no disponible');
    }
    
    const data = await response.json();
    
    // Retornar tasa USD -> VES
    return {
      fecha: new Date().toISOString().split('T')[0],
      precio: data.rates.VES || 36.15,
      moneda: 'USD',
      simbolo: '$'
    };
  } catch (error) {
    console.warn('API alternativa no disponible:', error);
    
    return {
      fecha: new Date().toISOString().split('T')[0],
      precio: 36.15,
      moneda: 'USD',
      simbolo: '$'
    };
  }
}

// Obtener con fallback
export async function getTasaCambio(): Promise<TasaBCV> {
  // Intentar primero método principal
  try {
    return await obtenerTasaCambio();
  } catch {
    // Fallback al método alternativo
    return await obtenerTasaCambioAlt();
  }
}

// Guardar tasa de cambio en historial
export function guardarTasaCambio(precio: number, fecha?: string): void {
  const fechaActual = fecha || new Date().toISOString().split('T')[0];
  
  const existente = historialTasasCambio.findIndex(
    t => t.fecha === fechaActual
  );
  
  const nuevaTasa: HistoricoTasaCambio = {
    fecha: fechaActual,
    precio_venta: precio,
    moneda: 'USD',
    fuente: 'BCV'
  };
  
  if (existente >= 0) {
    historialTasasCambio[existente] = nuevaTasa;
  } else {
    historialTasasCambio.push(nuevaTasa);
  }
}

// Obtener tasa de cambio para una fecha específica
export function getTasaCambioPorFecha(fecha: string): number {
  const tasa = historialTasasCambio.find(t => t.fecha === fecha);
  if (tasa) {
    return tasa.precio_venta;
  }
  
  // Si no existe exact match, buscar la más cercana anterior
  const tasasAnteriores = historialTasasCambio
    .filter(t => t.fecha <= fecha)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  
  if (tasasAnteriores.length > 0) {
    return tasasAnteriores[0].precio_venta;
  }
  
  return 36.15; // Default
}

// Obtener historial de tasas de cambio
export function getHistorialTasasCambio(): HistoricoTasaCambio[] {
  return [...historialTasasCambio].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

// Obtener la última tasa de cambio guardada
export function getUltimaTasaCambio(): number {
  if (historialTasasCambio.length === 0) {
    return 36.15; // Default
  }
  
  const sorted = [...historialTasasCambio].sort((a, b) => b.fecha.localeCompare(a.fecha));
  return sorted[0].precio_venta;
}

// Función para convertir monto de USD a BS
export function convertirUsdABs(montoUsd: number, fecha?: string): number {
  const tasa = fecha ? getTasaCambioPorFecha(fecha) : getUltimaTasaCambio();
  return montoUsd * tasa;
}

// Función para convertir monto de BS a USD
export function convertirBsAUsd(montoBs: number, fecha?: string): number {
  const tasa = fecha ? getTasaCambioPorFecha(fecha) : getUltimaTasaCambio();
  return montoBs / tasa;
}

// Inicializar con datos de ejemplo
function inicializarDatosDemo(): void {
  // Agregar algunas tasas de cambio de ejemplo
  const hoy = new Date();
  for (let i = 0; i < 6; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const fechaStr = fecha.toISOString().split('T')[0];
    guardarTasaCambio(36.15 + (i * 0.5), fechaStr);
  }
  
  // Agregar tasas activas de ejemplo
  for (let i = 0; i < 12; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    guardarTasaActiva(
      fecha.getFullYear(), 
      fecha.getMonth() + 1, 
      60.00 + (Math.random() * 5), // Variación pequeña
      'Tasa Activa BCV'
    );
  }
}

// Inicializar datos demo al cargar
inicializarDatosDemo();

export default { 
  obtenerTasaCambio, 
  obtenerTasaCambioAlt, 
  getTasaCambio, 
  obtenerTasaActiva, 
  getTasaActiva,
  guardarTasaActiva,
  getTasaActivaPorMes,
  getHistorialTasasActivas,
  guardarTasaCambio,
  getTasaCambioPorFecha,
  getHistorialTasasCambio,
  getUltimaTasaCambio,
  convertirUsdABs,
  convertirBsAUsd
};
