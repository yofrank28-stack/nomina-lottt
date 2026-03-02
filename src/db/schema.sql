-- ============================================================
-- GESTIÓN DE NÓMINA VENEZUELA - SQL Schema
-- Sistema de Gestión de Nómina Multi-Empresa
-- Incluye: Empleados, Nómina, Contabilidad, Provisiones LOTTT
-- ============================================================

-- ============================================================
-- TABLA: EMPRESAS
-- Gestión Multiempresa y Seguridad
-- ============================================================
CREATE TABLE IF NOT EXISTS empresas (
    id SERIAL PRIMARY KEY,
    rif VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    razon_social VARCHAR(200),
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    lunes_mes INT DEFAULT 4,
    es_inces_contribuyente BOOLEAN DEFAULT FALSE,
    num_empleados INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA: USUARIOS
-- Sistema de Autenticación y Roles
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombre_completo VARCHAR(100),
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('ADMIN_MAESTRO', 'ADMIN_EMPRESA', 'OPERADOR')),
    empresa_id INT REFERENCES empresas(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA: EMPLEADOS
-- Maestro de Empleados con Persistencia Histórica
-- ============================================================
CREATE TABLE IF NOT EXISTS empleados (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    cedula VARCHAR(15) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    fecha_nacimiento DATE,
    fecha_ingreso DATE NOT NULL,
    fecha_egreso DATE,
    cargo VARCHAR(100),
    departamento VARCHAR(100),
    sueldo_base_usd DECIMAL(15,2),
    estatus VARCHAR(10) CHECK (estatus IN ('ACTIVO', 'VACACIONES', 'EGRESADO', 'SUSPENDIDO')) DEFAULT 'ACTIVO',
    tipo_contrato VARCHAR(20) DEFAULT 'FIJO' CHECK (tipo_contrato IN ('FIJO', 'INDEFINIDO', 'TEMPORAL')),
    tiene_hijos BOOLEAN DEFAULT FALSE,
    cantidad_hijos INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, cedula)
);

-- ============================================================
-- TABLA: HISTORICO_LIQUIDACIONES
-- Registro Histórico de Liquidaciones
-- ============================================================
CREATE TABLE IF NOT EXISTS historico_liquidaciones (
    id SERIAL PRIMARY KEY,
    empleado_id INT NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
    empresa_id INT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    periodo DATE NOT NULL,
    ano INT NOT NULL,
    mes INT NOT NULL,
    quincena INT NOT NULL CHECK (quincena IN (1, 2)),
    dias_trabajados INT NOT NULL,
    lunes_periodo INT DEFAULT 4,
    sueldo_base DECIMAL(15,2),
    bono_vacacional DECIMAL(15,2),
    utilidades DECIMAL(15,2),
    otras_asignaciones DECIMAL(15,2),
    total_asignaciones DECIMAL(15,2),
    ivss_trabajador DECIMAL(15,2),
    rpe_trabajador DECIMAL(15,2),
    faov_trabajador DECIMAL(15,2),
    inces_trabajador DECIMAL(15,2),
    inces_patronal DECIMAL(15,2),
    otras_deducciones DECIMAL(15,2),
    total_deducciones DECIMAL(15,2),
    neto_pagar DECIMAL(15,2),
    tipo_cambio_usd DECIMAL(15,4),
    monto_bs DECIMAL(15,2),
    concepto_pago VARCHAR(20) DEFAULT 'NOMINA' CHECK (concepto_pago IN ('NOMINA', 'UTILIDADES', 'AGUINALDOS')),
    recibo_json JSONB,
    fecha_liquidacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_egreso DATE,
    UNIQUE(empleado_id, ano, mes, quincena)
);

-- ============================================================
-- TABLA: PARAMETROS_NOMINA
-- Parámetros del Sistema de Nómina
-- ============================================================
CREATE TABLE IF NOT EXISTS parametros_nominal (
    id SERIAL PRIMARY KEY,
    ano INT NOT NULL,
    mes INT NOT NULL,
    salario_minimo DECIMAL(15,2) NOT NULL,
    tasa_cambio_bcv DECIMAL(15,4),
    fecha_actualizacion_tasa TIMESTAMP,
    umv DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA: DIAS_LABORABLES
-- Control de Días Laborables por Empresa
-- ============================================================
CREATE TABLE IF NOT EXISTS dias_laborables (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    ano INT NOT NULL,
    mes INT NOT NULL,
    dias_trabajados INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, ano, mes)
);

-- ============================================================
-- TRIGGER: Validación de Cédula Duplicada
-- ============================================================
CREATE OR REPLACE FUNCTION validar_cedula_unica()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM empleados 
        WHERE empresa_id = NEW.empresa_id 
        AND cedula = NEW.cedula 
        AND id != NEW.id
    ) THEN
        RAISE EXCEPTION 'ERROR: La Cédula % ya está registrada para esta empresa. No se permiten duplicados.', NEW.cedula;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_cedula_unica
    BEFORE INSERT OR UPDATE ON empleados
    FOR EACH ROW
    EXECUTE FUNCTION validar_cedula_unica();

-- ============================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================
CREATE INDEX idx_empleados_empresa ON empleados(empresa_id);
CREATE INDEX idx_empleados_cedula ON empleados(cedula);
CREATE INDEX idx_empleados_estatus ON empleados(estatus);
CREATE INDEX idx_liquidaciones_empleado ON historico_liquidaciones(empleado_id);
CREATE INDEX idx_liquidaciones_periodo ON historico_liquidaciones(periodo);
CREATE INDEX idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX idx_usuarios_username ON usuarios(username);

-- ============================================================
-- DATOS INICIALES: ADMIN MAESTRO
-- ============================================================
-- Password: Admin123! (hash bcrypt)
-- Este usuario se crea automáticamente
INSERT INTO empresas (rif, nombre, lunes_mes, es_inces_contribuyente, num_empleados)
VALUES ('J-00000000-0', 'ADMINISTRACIÓN MAESTRA', 4, false, 0)
ON CONFLICT (rif) DO NOTHING;

INSERT INTO usuarios (username, password_hash, nombre_completo, rol, empresa_id)
VALUES (
    'admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzvIlg4Z4u', -- Password: Admin123!
    'Administrador Maestro',
    'ADMIN_MAESTRO',
    1
)
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- TABLA: ASIENTOS CONTABLES
-- Registro de Asientos de Diario Automáticos
-- ============================================================
CREATE TABLE IF NOT EXISTS asientos_contables (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    periodo DATE NOT NULL,
    ano INT NOT NULL,
    mes INT NOT NULL,
    quincena INT CHECK (quincena IN (1, 2)),
    tipo_asiento VARCHAR(20) NOT NULL CHECK (tipo_asiento IN ('NOMINA', 'UTILIDADES', 'AGUINALDOS', 'CIERRE_MES')),
    concepto VARCHAR(200) NOT NULL,
    total_debe DECIMAL(15,2) NOT NULL,
    total_haber DECIMAL(15,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'APROBADO', 'ANULADO')),
   json_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, ano, mes, quincena, tipo_asiento)
);

-- ============================================================
-- TABLA: DETALLE ASIENTOS CONTABLES
-- Detalle de cada línea del asiento contable
-- ============================================================
CREATE TABLE IF NOT EXISTS detalle_asientos (
    id SERIAL PRIMARY KEY,
    asiento_id INT NOT NULL REFERENCES asientos_contables(id) ON DELETE CASCADE,
    cuenta_contable VARCHAR(20) NOT NULL,
    nombre_cuenta VARCHAR(100) NOT NULL,
    debe DECIMAL(15,2) DEFAULT 0,
    haber DECIMAL(15,2) DEFAULT 0,
    referencia VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA: PROVISIONES LABORALES
-- Provisiones de Pasivos Laborales (Art. 142a LOTTT)
-- ============================================================
CREATE TABLE IF NOT EXISTS provisiones_laborales (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    empleado_id INT REFERENCES empleados(id) ON DELETE SET NULL,
    ano INT NOT NULL,
    mes INT NOT NULL,
    tipo_provision VARCHAR(50) NOT NULL CHECK (tipo_provision IN (
        'GARANTIA_PRESTACIONES',  -- Art. 142a: 15 días trimestrales
        'INTERESES_PRESTACIONES',  -- Intereses sobre Prestaciones (tasa activa BCV)
        'ALICUOTA_UTILIDADES',     -- Alícuota de Utilidades
        'ALICUOTA_BONO_VACACIONAL' -- Alícuota de Bono Vacacional
    )),
    monto_provision DECIMAL(15,2) NOT NULL,
    tasa_aplicada DECIMAL(10,4),
    base_calculo DECIMAL(15,2),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(empresa_id, empleado_id, ano, mes, tipo_provision)
);

-- ============================================================
-- TABLA: HISTORICO EGRESADOS
-- Registro Histórico de Empleados Egresados
-- ============================================================
CREATE TABLE IF NOT EXISTS historico_egresados (
    id SERIAL PRIMARY KEY,
    empleado_id INT NOT NULL,
    empresa_id INT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    cedula VARCHAR(15) NOT NULL,
    nombre_completo VARCHAR(200) NOT NULL,
    fecha_ingreso DATE NOT NULL,
    fecha_egreso DATE NOT NULL,
    causa_egreso VARCHAR(50),
    motivo TEXT,
    liquidacion_final DECIMAL(15,2),
    prestaciones_sociales DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ÍNDICES PARA OPTIMIZACIÓN - CONTABILIDAD
-- ============================================================
CREATE INDEX idx_asientos_empresa_periodo ON asientos_contables(empresa_id, ano, mes);
CREATE INDEX idx_detalle_asientos ON detalle_asientos(asiento_id);
CREATE INDEX idx_provisiones_empresa_mes ON provisiones_laborales(empresa_id, ano, mes);
CREATE INDEX idx_provisiones_empleado ON provisiones_laborales(empleado_id);
CREATE INDEX idx_historico_egresados_cedula ON historico_egresados(cedula);
CREATE INDEX idx_historico_egresados_empresa ON historico_egresados(empresa_id);
