-- CreateTable
CREATE TABLE `estados` (
    `id_estado` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(120) NOT NULL,

    UNIQUE INDEX `uq_estado_nombre`(`nombre`),
    PRIMARY KEY (`id_estado`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `municipios` (
    `id_municipio` INTEGER NOT NULL AUTO_INCREMENT,
    `id_estado` INTEGER NOT NULL,
    `nombre` VARCHAR(160) NOT NULL,

    UNIQUE INDEX `uq_mun_estado_nombre`(`id_estado`, `nombre`),
    INDEX `idx_mun_estado`(`id_estado`),
    PRIMARY KEY (`id_municipio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `codigos_postales` (
    `id_cp` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo_postal` VARCHAR(10) NOT NULL,
    `id_municipio` INTEGER NOT NULL,

    UNIQUE INDEX `uq_cp_mun`(`codigo_postal`, `id_municipio`),
    INDEX `idx_cp_municipio`(`id_municipio`),
    PRIMARY KEY (`id_cp`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `colonias` (
    `id_colonia` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(160) NOT NULL,
    `id_cp` INTEGER NOT NULL,

    UNIQUE INDEX `uq_col_nombre_cp`(`nombre`, `id_cp`),
    INDEX `idx_col_cp`(`id_cp`),
    PRIMARY KEY (`id_colonia`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `empresa` (
    `id_empresa` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(160) NOT NULL,
    `razon_social` VARCHAR(200) NULL,
    `rfc` VARCHAR(20) NULL,
    `regimen_fiscal` VARCHAR(80) NULL,
    `telefono` VARCHAR(30) NULL,
    `correo` VARCHAR(120) NULL,
    `sitio_web` VARCHAR(200) NULL,
    `logo_url` VARCHAR(300) NULL,
    `calle` VARCHAR(160) NULL,
    `num_ext` VARCHAR(20) NULL,
    `num_int` VARCHAR(20) NULL,
    `referencia` VARCHAR(200) NULL,
    `id_estado` INTEGER NULL,
    `id_municipio` INTEGER NULL,
    `id_colonia` INTEGER NULL,
    `codigo_postal` VARCHAR(10) NULL,
    `estado_registro` ENUM('activa', 'inactiva') NOT NULL DEFAULT 'activa',
    `fecha_creacion` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ultima_modificacion` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_empresa_nombre`(`nombre`),
    INDEX `idx_emp_estado_mun`(`id_estado`, `id_municipio`),
    PRIMARY KEY (`id_empresa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `empresa_sucursal` (
    `id_empresa_sucursal` INTEGER NOT NULL AUTO_INCREMENT,
    `id_empresa` INTEGER NOT NULL,
    `nombre_sucursal` VARCHAR(160) NOT NULL,
    `telefono` VARCHAR(30) NULL,
    `correo` VARCHAR(120) NULL,
    `calle` VARCHAR(160) NULL,
    `num_ext` VARCHAR(20) NULL,
    `num_int` VARCHAR(20) NULL,
    `referencia` VARCHAR(200) NULL,
    `id_estado` INTEGER NULL,
    `id_municipio` INTEGER NULL,
    `id_colonia` INTEGER NULL,
    `codigo_postal` VARCHAR(10) NULL,
    `latitud` DECIMAL(10, 7) NULL,
    `longitud` DECIMAL(10, 7) NULL,
    `horario_json` JSON NULL,
    `gerente` VARCHAR(160) NULL,
    `rfc` VARCHAR(20) NULL,
    `regimen_fiscal` VARCHAR(80) NULL,
    `sitio_web` VARCHAR(200) NULL,
    `logo_url` VARCHAR(300) NULL,
    `estado_registro` ENUM('activa', 'inactiva') NOT NULL DEFAULT 'activa',
    `fecha_creacion` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ultima_modificacion` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_emp_suc_emp`(`id_empresa`),
    INDEX `idx_emp_suc_cp`(`codigo_postal`),
    INDEX `idx_emp_suc_estado_mun`(`id_estado`, `id_municipio`),
    PRIMARY KEY (`id_empresa_sucursal`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organizacion` (
    `id_organizacion` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(160) NOT NULL,
    `razon_social` VARCHAR(200) NULL,
    `rfc` VARCHAR(20) NULL,
    `regimen_fiscal` VARCHAR(80) NULL,
    `telefono` VARCHAR(30) NULL,
    `correo` VARCHAR(120) NULL,
    `sitio_web` VARCHAR(200) NULL,
    `logo_url` VARCHAR(300) NULL,
    `calle` VARCHAR(160) NULL,
    `num_ext` VARCHAR(20) NULL,
    `num_int` VARCHAR(20) NULL,
    `referencia` VARCHAR(200) NULL,
    `id_estado` INTEGER NULL,
    `id_municipio` INTEGER NULL,
    `id_colonia` INTEGER NULL,
    `codigo_postal` VARCHAR(10) NULL,
    `estado` ENUM('activa', 'inactiva') NOT NULL DEFAULT 'activa',
    `fecha_creacion` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ultima_modificacion` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_org_nombre`(`nombre`),
    INDEX `idx_org_estado_mun`(`id_estado`, `id_municipio`),
    PRIMARY KEY (`id_organizacion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organizacion_sucursal` (
    `id_organizacion_sucursal` INTEGER NOT NULL AUTO_INCREMENT,
    `id_organizacion` INTEGER NOT NULL,
    `nombre_sucursal` VARCHAR(160) NOT NULL,
    `telefono` VARCHAR(30) NULL,
    `correo` VARCHAR(120) NULL,
    `calle` VARCHAR(160) NULL,
    `num_ext` VARCHAR(20) NULL,
    `num_int` VARCHAR(20) NULL,
    `referencia` VARCHAR(200) NULL,
    `id_estado` INTEGER NULL,
    `id_municipio` INTEGER NULL,
    `id_colonia` INTEGER NULL,
    `codigo_postal` VARCHAR(10) NULL,
    `latitud` DECIMAL(10, 7) NULL,
    `longitud` DECIMAL(10, 7) NULL,
    `horario_json` JSON NULL,
    `gerente` VARCHAR(160) NULL,
    `estado` ENUM('activa', 'inactiva') NOT NULL DEFAULT 'activa',
    `fecha_creacion` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ultima_modificacion` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_orgsuc_org`(`id_organizacion`),
    PRIMARY KEY (`id_organizacion_sucursal`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipo_rol` (
    `id_rol` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(80) NOT NULL,

    UNIQUE INDEX `uq_rol_nombre`(`nombre`),
    PRIMARY KEY (`id_rol`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario` (
    `id_usuario` INTEGER NOT NULL AUTO_INCREMENT,
    `correo` VARCHAR(160) NOT NULL,
    `password_hash` VARCHAR(100) NOT NULL,
    `nombre_completo` VARCHAR(160) NOT NULL,
    `id_rol` INTEGER NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `fecha_creacion` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ultima_modificacion` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_usuario_correo`(`correo`),
    INDEX `idx_usuario_rol`(`id_rol`),
    PRIMARY KEY (`id_usuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asignacion_usuario` (
    `id_asignacion` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `id_empresa_sucursal` INTEGER NULL,
    `id_instalacion` INTEGER NULL,
    `fecha_asignacion` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_asig_usuario`(`id_usuario`),
    INDEX `idx_asig_sucursal`(`id_empresa_sucursal`),
    INDEX `idx_asig_instalacion`(`id_instalacion`),
    PRIMARY KEY (`id_asignacion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `token_recuperacion` (
    `id_token` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `token` VARCHAR(120) NOT NULL,
    `expira_en` DATETIME(0) NOT NULL,
    `usado` BOOLEAN NOT NULL DEFAULT false,
    `fecha_creacion` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_token`(`token`),
    INDEX `idx_tok_usuario`(`id_usuario`),
    PRIMARY KEY (`id_token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `instalacion` (
    `id_instalacion` INTEGER NOT NULL AUTO_INCREMENT,
    `id_empresa_sucursal` INTEGER NOT NULL,
    `nombre_instalacion` VARCHAR(160) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `fecha_creacion` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_ins_sucursal`(`id_empresa_sucursal`),
    PRIMARY KEY (`id_instalacion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `catalogo_sensores` (
    `id_sensor` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(160) NOT NULL,
    `unidad` VARCHAR(40) NULL,
    `tipo_medida` ENUM('temperatura', 'ph', 'oxigeno_disuelto', 'conductividad', 'turbidez', 'salinidad', 'otro') NULL,
    `rango_min` DECIMAL(10, 3) NULL,
    `rango_max` DECIMAL(10, 3) NULL,

    UNIQUE INDEX `uq_sensor_nombre`(`nombre`),
    PRIMARY KEY (`id_sensor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sensor_instalado` (
    `id_sensor_instalado` INTEGER NOT NULL AUTO_INCREMENT,
    `id_instalacion` INTEGER NOT NULL,
    `id_sensor` INTEGER NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `fecha_instalada` DATE NULL,

    INDEX `idx_si_instalacion`(`id_instalacion`),
    INDEX `idx_si_sensor`(`id_sensor`),
    PRIMARY KEY (`id_sensor_instalado`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alertas` (
    `id_alerta` INTEGER NOT NULL AUTO_INCREMENT,
    `id_instalacion` INTEGER NOT NULL,
    `mensaje` VARCHAR(255) NOT NULL,
    `nivel` ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'info',
    `atendida` BOOLEAN NOT NULL DEFAULT false,
    `fecha_creacion` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_alerta_instalacion`(`id_instalacion`),
    PRIMARY KEY (`id_alerta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parametros` (
    `id_parametro` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(120) NOT NULL,
    `unidad` VARCHAR(40) NULL,

    UNIQUE INDEX `uq_parametro_nombre`(`nombre`),
    PRIMARY KEY (`id_parametro`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `especies` (
    `id_especie` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(160) NOT NULL,

    UNIQUE INDEX `uq_especie_nombre`(`nombre`),
    PRIMARY KEY (`id_especie`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `especie_parametro` (
    `id_especie_parametro` INTEGER NOT NULL AUTO_INCREMENT,
    `id_especie` INTEGER NOT NULL,
    `id_parametro` INTEGER NOT NULL,
    `valor_min` DECIMAL(10, 3) NULL,
    `valor_max` DECIMAL(10, 3) NULL,

    UNIQUE INDEX `uq_esparam`(`id_especie`, `id_parametro`),
    PRIMARY KEY (`id_especie_parametro`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `procesos` (
    `id_proceso` INTEGER NOT NULL AUTO_INCREMENT,
    `id_instalacion` INTEGER NOT NULL,
    `id_especie` INTEGER NULL,
    `nombre` VARCHAR(160) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `fecha_inicio` DATE NULL,
    `fecha_fin` DATE NULL,
    `estado` ENUM('activo', 'pausado', 'finalizado') NOT NULL DEFAULT 'activo',
    `fecha_creacion` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_proc_ins`(`id_instalacion`),
    INDEX `idx_proc_especie`(`id_especie`),
    PRIMARY KEY (`id_proceso`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lectura` (
    `id_lectura` BIGINT NOT NULL AUTO_INCREMENT,
    `id_sensor_instalado` INTEGER NOT NULL,
    `valor` DECIMAL(12, 4) NOT NULL,
    `tomada_en` DATETIME(0) NOT NULL,

    INDEX `idx_lectura_sensor_fecha`(`id_sensor_instalado`, `tomada_en`),
    INDEX `idx_lectura_fecha`(`tomada_en`),
    PRIMARY KEY (`id_lectura`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `promedio` (
    `id_sensor_instalado` INTEGER NOT NULL,
    `anio` SMALLINT NOT NULL,
    `mes` TINYINT NOT NULL,
    `dia` TINYINT NOT NULL,
    `hora` TINYINT NOT NULL,
    `conteo` INTEGER NOT NULL DEFAULT 0,
    `suma` DECIMAL(20, 6) NOT NULL DEFAULT 0,
    `promedio` DECIMAL(20, 6) NOT NULL DEFAULT 0,

    INDEX `idx_prom_sensor_fecha`(`id_sensor_instalado`, `anio`, `mes`, `dia`),
    PRIMARY KEY (`id_sensor_instalado`, `anio`, `mes`, `dia`, `hora`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resumen_lectura_horaria` (
    `id_sensor_instalado` INTEGER NOT NULL,
    `fecha_hora` DATETIME(0) NOT NULL,
    `min_val` DECIMAL(20, 6) NOT NULL,
    `max_val` DECIMAL(20, 6) NOT NULL,
    `avg_val` DECIMAL(20, 6) NOT NULL,
    `cnt` INTEGER NOT NULL,

    INDEX `idx_res_hora_sensor`(`id_sensor_instalado`, `fecha_hora`),
    PRIMARY KEY (`id_sensor_instalado`, `fecha_hora`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `catalogo_especies` (
    `id_especie` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_comun` VARCHAR(120) NOT NULL,
    `nombre_cientifico` VARCHAR(160) NULL,
    `notas` VARCHAR(255) NULL,
    `fecha_creacion` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ultima_modificacion` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_ce_nombre_comun`(`nombre_comun`),
    UNIQUE INDEX `uq_ce_nombre_cientifico`(`nombre_cientifico`),
    PRIMARY KEY (`id_especie`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `especies_instaladas` (
    `id_especie_instalada` INTEGER NOT NULL AUTO_INCREMENT,
    `id_instalacion` INTEGER NOT NULL,
    `id_especie` INTEGER NOT NULL,
    `estado` ENUM('activo', 'retirado') NOT NULL DEFAULT 'activo',
    `fecha_introduccion` DATE NOT NULL,
    `fecha_retiro` DATE NULL,
    `individuos` INTEGER NULL,
    `biomasa_kg` DECIMAL(10, 2) NULL,
    `notas` VARCHAR(255) NULL,
    `fecha_creacion` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ultima_modificacion` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_ei_instalacion`(`id_instalacion`),
    INDEX `idx_ei_especie`(`id_especie`),
    PRIMARY KEY (`id_especie_instalada`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `especie_tracking` (
    `id_tracking` INTEGER NOT NULL AUTO_INCREMENT,
    `id_especie_instalada` INTEGER NOT NULL,
    `fecha` DATE NOT NULL,
    `individuos` INTEGER NULL,
    `biomasa_kg` DECIMAL(10, 2) NULL,
    `notas` VARCHAR(255) NULL,

    INDEX `idx_et_especie_instalada`(`id_especie_instalada`),
    INDEX `idx_et_fecha`(`fecha`),
    PRIMARY KEY (`id_tracking`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `municipios` ADD CONSTRAINT `fk_mun_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `codigos_postales` ADD CONSTRAINT `fk_cp_municipio` FOREIGN KEY (`id_municipio`) REFERENCES `municipios`(`id_municipio`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `colonias` ADD CONSTRAINT `fk_col_cp` FOREIGN KEY (`id_cp`) REFERENCES `codigos_postales`(`id_cp`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `empresa` ADD CONSTRAINT `fk_emp_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `empresa` ADD CONSTRAINT `fk_emp_mun` FOREIGN KEY (`id_municipio`) REFERENCES `municipios`(`id_municipio`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `empresa` ADD CONSTRAINT `fk_emp_col` FOREIGN KEY (`id_colonia`) REFERENCES `colonias`(`id_colonia`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `empresa_sucursal` ADD CONSTRAINT `fk_emp_suc_emp` FOREIGN KEY (`id_empresa`) REFERENCES `empresa`(`id_empresa`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `empresa_sucursal` ADD CONSTRAINT `fk_emp_suc_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `empresa_sucursal` ADD CONSTRAINT `fk_emp_suc_mun` FOREIGN KEY (`id_municipio`) REFERENCES `municipios`(`id_municipio`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `empresa_sucursal` ADD CONSTRAINT `fk_emp_suc_col` FOREIGN KEY (`id_colonia`) REFERENCES `colonias`(`id_colonia`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organizacion` ADD CONSTRAINT `fk_org_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organizacion` ADD CONSTRAINT `fk_org_mun` FOREIGN KEY (`id_municipio`) REFERENCES `municipios`(`id_municipio`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organizacion` ADD CONSTRAINT `fk_org_col` FOREIGN KEY (`id_colonia`) REFERENCES `colonias`(`id_colonia`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organizacion_sucursal` ADD CONSTRAINT `fk_orgsuc_org` FOREIGN KEY (`id_organizacion`) REFERENCES `organizacion`(`id_organizacion`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organizacion_sucursal` ADD CONSTRAINT `fk_orgsuc_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organizacion_sucursal` ADD CONSTRAINT `fk_orgsuc_mun` FOREIGN KEY (`id_municipio`) REFERENCES `municipios`(`id_municipio`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organizacion_sucursal` ADD CONSTRAINT `fk_orgsuc_col` FOREIGN KEY (`id_colonia`) REFERENCES `colonias`(`id_colonia`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuario` ADD CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`id_rol`) REFERENCES `tipo_rol`(`id_rol`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asignacion_usuario` ADD CONSTRAINT `fk_asig_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asignacion_usuario` ADD CONSTRAINT `fk_asig_sucursal` FOREIGN KEY (`id_empresa_sucursal`) REFERENCES `empresa_sucursal`(`id_empresa_sucursal`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asignacion_usuario` ADD CONSTRAINT `fk_asig_instalacion` FOREIGN KEY (`id_instalacion`) REFERENCES `instalacion`(`id_instalacion`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `token_recuperacion` ADD CONSTRAINT `fk_tok_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instalacion` ADD CONSTRAINT `fk_ins_sucursal` FOREIGN KEY (`id_empresa_sucursal`) REFERENCES `empresa_sucursal`(`id_empresa_sucursal`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sensor_instalado` ADD CONSTRAINT `fk_si_instalacion` FOREIGN KEY (`id_instalacion`) REFERENCES `instalacion`(`id_instalacion`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sensor_instalado` ADD CONSTRAINT `fk_si_sensor` FOREIGN KEY (`id_sensor`) REFERENCES `catalogo_sensores`(`id_sensor`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alertas` ADD CONSTRAINT `fk_alerta_instalacion` FOREIGN KEY (`id_instalacion`) REFERENCES `instalacion`(`id_instalacion`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `especie_parametro` ADD CONSTRAINT `fk_esparam_especie` FOREIGN KEY (`id_especie`) REFERENCES `especies`(`id_especie`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `especie_parametro` ADD CONSTRAINT `fk_esparam_param` FOREIGN KEY (`id_parametro`) REFERENCES `parametros`(`id_parametro`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procesos` ADD CONSTRAINT `fk_proc_ins` FOREIGN KEY (`id_instalacion`) REFERENCES `instalacion`(`id_instalacion`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `procesos` ADD CONSTRAINT `fk_proc_especie` FOREIGN KEY (`id_especie`) REFERENCES `especies`(`id_especie`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lectura` ADD CONSTRAINT `fk_lectura_sensor_instalado` FOREIGN KEY (`id_sensor_instalado`) REFERENCES `sensor_instalado`(`id_sensor_instalado`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promedio` ADD CONSTRAINT `promedio_id_sensor_instalado_fkey` FOREIGN KEY (`id_sensor_instalado`) REFERENCES `sensor_instalado`(`id_sensor_instalado`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resumen_lectura_horaria` ADD CONSTRAINT `resumen_lectura_horaria_id_sensor_instalado_fkey` FOREIGN KEY (`id_sensor_instalado`) REFERENCES `sensor_instalado`(`id_sensor_instalado`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `especies_instaladas` ADD CONSTRAINT `fk_ei_instalacion` FOREIGN KEY (`id_instalacion`) REFERENCES `instalacion`(`id_instalacion`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `especies_instaladas` ADD CONSTRAINT `fk_ei_especie_ce` FOREIGN KEY (`id_especie`) REFERENCES `catalogo_especies`(`id_especie`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `especie_tracking` ADD CONSTRAINT `fk_et_ei` FOREIGN KEY (`id_especie_instalada`) REFERENCES `especies_instaladas`(`id_especie_instalada`) ON DELETE CASCADE ON UPDATE CASCADE;