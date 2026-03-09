# 📋 Guía de Despliegue Local - Nómina LOTTT

## 1. Paso a Paso de Despliegue Local

### Opción A: Clonar desde cero (nuevo proyecto)

```bash
# 1. Clonar el proyecto
git clone https://github.com/yofrank28-stack/nomina-lottt.git nomina-lottt

# 2. Entrar al directorio
cd nomina-lottt

# 3. Instalar dependencias (usando Bun)
bun install

# 4. Iniciar el servidor de desarrollo
bun dev

# 5. Abrir en el navegador
# http://localhost:3000
```

### Opción B: Si ya tienes el proyecto y necesitas actualizar

```bash
# 1. Navegar al directorio del proyecto
cd nomina-lottt

# 2. Obtener los últimos cambios
git pull origin main

# 3. Actualizar dependencias
bun install

# 4. Iniciar el servidor
bun dev
```

### Verificación post-instalación

```bash
# Verificar que no hay vulnerabilidades
npm audit

# Verificar tipos TypeScript
bun typecheck

# Verificar código con ESLint
bun lint
```

---

## 2. Credenciales de Acceso

El sistema incluye usuarios de demostración preconfigurados:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| **admin** | **Admin123!** | Administrador Maestro (Súper Usuario) |
| contador | Contador123! | Contador (solo empresa específica) |

### Credenciales del Administrador Maestro

- **Usuario:** `admin`
- **Contraseña:** `Admin123!`

Este usuario tiene acceso completo al sistema y puede:
- Gestionar todas las empresas
- Acceder a todos los módulos
- Crear/modificar usuarios
- Configurar parámetros del sistema

---

## 3. Ruta de Administración

Una vez que el servidor esté corriendo:

### URL de Acceso al Sistema
```
http://localhost:3000
```

### Panel de Administración
No existe una ruta `/admin` o `/dashboard` separada. El sistema muestra directamente la página de login en la ruta principal `/`. Después de iniciar sesión, serás redirigido al panel principal según tu rol.

### Flujo de Acceso:
1. Ir a `http://localhost:3000`
2. Ingresar credenciales (admin / Admin123!)
3. Acceso directo al panel de control

---

## 4. Documentación de Seguridad

### ⚠️ IMPORTANTE: Cambiar contraseña por defecto

Por seguridad, **DEBES** cambiar la contraseña del administrador después del primer ingreso.

#### Método 1: Directamente en la base de datos (SQL)

```sql
-- Generar nuevo hash de contraseña (usando bcrypt)
-- Ejemplo con Node.js:
const bcrypt = require('bcrypt');
const newHash = await bcrypt.hash('TuNuevaContrasena123!', 12);
console.log(newHash); -- Usar este hash en la consulta

-- Actualizar en la base de datos:
UPDATE usuarios 
SET password_hash = '$2b$12$TU_NUEVO_HASH_AQUI' 
WHERE username = 'admin';
```

#### Método 2: A través del código (src/lib/store.ts)

Editar el archivo `src/lib/store.ts` y buscar la función `login`:

```typescript
// Línea ~306
if (username === 'admin' && password === 'TU_NUEVA_CONTRASEÑA') {
  // ... resto del código
}
```

**Recomendación:** Usar método de base de datos con hash bcrypt para mayor seguridad.

### Buenas prácticas de seguridad:

1. ✅ Cambiar contraseña inmediatamente después del primer login
2. ✅ Usar contraseña mínima de 12 caracteres
3. ✅ Incluir mayúsculas, minúsculas, números y símbolos
4. ✅ No usar contraseñas fáciles como "Admin123!" en producción
5. ✅ Considerar implementar autenticación real con JWT/Session en producción

---

## 📝 Resumen Rápido

| Ítem | Valor |
|------|-------|
| URL | http://localhost:3000 |
| Usuario Admin | admin |
| Contraseña Admin | Admin123! |
| Comando iniciar | bun dev |
| Comando instalar | bun install |

---

*Documento generado para el proyecto Nómina LOTTT - Versión optimizada con seguridad actualizada.*
