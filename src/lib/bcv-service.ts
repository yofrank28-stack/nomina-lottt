// ============================================================
// SERVICIO BCV - Banco Central de Venezuela
// Obtención de tasa de cambio oficial del dólar
// ============================================================

export interface TasaBCV {
  fecha: string;
  precio: number;
  moneda: string;
  simbolo: string;
}

// URLs del BCV para obtener tasas de cambio
const BCV_API_URL = 'https://www.bcv.org.ve/servicios/recurso';

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

export default { obtenerTasaCambio, obtenerTasaCambioAlt, getTasaCambio };
