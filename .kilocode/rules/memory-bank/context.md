# Active Context: Nómina Venezuela SaaS Enterprise

## Current State

**Project Status**: ✅ Plataforma SaaS Multiempresa - Enterprise Edition

Sistema de nómina empresarial con soporte para:
- Gestión multiempresa con aislamiento total
- Cálculo de nómina quincenal (15 días)
- Deducciones legales (IVSS, RPE, FAOV, INCES)
- Beneficios (bono vacacional, utilidades)
- Conversión USD/VES con tasa BCV
- Prestaciones Sociales (Doble Vía)
- Reportes TXT para bancos yentes

## Recently Completed

- [x] REDISEÑO SAAS ENTERPRISE:
  - Dashboard Master con métricas de licencias
  - Widget Tasas BCV + Tasa Activa
  - Sistema de validación de pagos
  - Diseño Dark Mode profesional
- [x] MOTOR DE CÁLCULOS LEGALES:
  - Doble Vía (Garantía vs Retroactividad)
  - Salary Integral (Art. 104 LOTTT)
  - Bono Vacacional escala (15+1 días)
  - Utilidades personalizables
  - Contribución Especial 9%
- [x] REPORTES TXT:
  - Formatos para Banesco, Mercantil, Venezuela, Provincial
  - Reportes para TIUNA, BANAVIH, SENIAT
- [x] SISTEMA DE ROLES:
  - MASTER, ADMIN_EMPRESA, ANALISTA, TRABAJADOR
  - Aislamiento por sesión y empresa

## Recently Completed

- [x] REWRITE COMPLETO Controlador Nómina:
  - VAR SueldoMensual = Valor de 'Sueldo Base' en Personal
  - CALC SueldoQuincena = SueldoMensual / 2 (130 → 65)
  - BLOQUEO BCV: Si Moneda=='VES', Multiplicador=1 (PROHIBIDO 36,15)
  - FORMATO: Intl.NumberFormat('es-VE') → punto miles, coma decimales
  - PERSISTENCIA: Función saveIndividualRecord() con botón naranja "GUARDAR CAMBIOS INDIVIDUAL"
- [x] Actualización Tasa BCV: 443,26 (13/03/2026)
  - Neto USD = Neto Bs / 443,26
- [x] Deducciones Ley Marzo 2026 (5 Lunes):
  - IVSS (4%): ((Sueldo*12)/52)*0.04*5
  - RPE (0.5%): ((Sueldo*12)/52)*0.005*5
  - FAOV (1%): SueldoQuincena*0.01
- [x] Corrección UI: Debug log + re-render forzado tras guardar
- [x] Corrección procesarNomina: Lógica dinámica desde Personal, no sobreescribe ediciones
- [x] Reparación persistencia: Eliminado reset de conceptos al cambiar de empleado
- [x] Sincronización recibo: Datos leídos directamente de Nomina_Procesada (loteEspera)
- [x] REDISEÑO SAAS MULTIEMPRESA:
  - Widget Tasas del Día: Tasa BCV + Tasa Activa Prestaciones
  - Dashboard Master: Métricas Binance/Zinli/Pago Móvil/Pendientes
  - Tabla de empresas con semáforo de licencias (active/suspended/terminated)
  - Diseño Dark Mode con verde esmeralda y naranja financiero
  - Entorno visualmente aislado por empresa

## Current Focus

Módulo de Personal y Nómina - Cálculos de sueldo y conversión de moneda

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Home page | ✅ Ready |
| `src/app/layout.tsx` | Root layout | ✅ Ready |
| `src/app/globals.css` | Global styles | ✅ Ready |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## Current Focus

The template is ready. Next steps depend on user requirements:

1. What type of application to build
2. What features are needed
3. Design/branding preferences

## Quick Start Guide

### To add a new page:

Create a file at `src/app/[route]/page.tsx`:
```tsx
export default function NewPage() {
  return <div>New page content</div>;
}
```

### To add components:

Create `src/components/` directory and add components:
```tsx
// src/components/ui/Button.tsx
export function Button({ children }: { children: React.ReactNode }) {
  return <button className="px-4 py-2 bg-blue-600 text-white rounded">{children}</button>;
}
```

### To add a database:

Follow `.kilocode/recipes/add-database.md`

### To add API routes:

Create `src/app/api/[route]/route.ts`:
```tsx
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello" });
}
```

## Available Recipes

| Recipe | File | Use Case |
|--------|------|----------|
| Add Database | `.kilocode/recipes/add-database.md` | Data persistence with Drizzle + SQLite |

## Pending Improvements

- [ ] Add more recipes (auth, email, etc.)
- [ ] Add example components
- [ ] Add testing setup recipe

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| 2026-03-12 | Corrección lógica conversión BCV - Sueldo VES ahora es literal (no multiplica por tasa) |
| 2026-03-12 | Ajuste fórmula nómina: (sueldo/30)*dias para que 130Bs*15días=65Bs |
| 2026-03-13 | Reconfiguración módulo Nómina: Sincronización total, entrada manual, botones duales, acciones por lote |
| 2026-03-13 | Corrección cálculo quincenal: Sueldo Base = monthly/2 (130→65 Bs), eliminada conversión automática |
| 2026-03-13 | Guardado Individual mejorado, formato numérico regional (punto miles, coma decimales) |
| 2026-03-13 | REWRITE completo nómina: SueldoQuincena=SueldoMensual/2, BLOQUEO BCV=1 para VES, Intl.NumberFormat('es-VE'), saveIndividualRecord() |
| 2026-03-13 | Actualización tasa BCV=443,26, deducciones Ley Marzo 2026 (5 Lunes), debug+re-render tras guardar |
| 2026-03-13 | SaaS Enterprise: Dashboard Master, métricas licencias, widget tasas, semáforo licencias, Dark Mode |
| 2026-03-13 | Motor Cálculos Legales: Doble Vía (Garantía/Retroactividad), Salary Integral, Bono Vacacional escala |
| 2026-03-13 | Reportes TXT: Bancos (Banesco/Mercantil/etc), Entes (TIUNA/BANAVIH/SENIAT), Recibos legales |
| 2026-03-13 | Sistema Roles: MASTER/ADMIN_EMPRESA/ANALISTA/TRABAJADOR con aislamiento multiempresa |
