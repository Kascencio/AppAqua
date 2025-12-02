/* =========================================================
   BASE DE DATOS COMPLETA (VPS + INTEGRACIONES V4)
   Compatible: MySQL 5.7+
   Juego de caracteres: utf8mb4
   ========================================================= */

SET NAMES utf8mb4;
SET @OLD_SQL_MODE := @@SQL_MODE;
SET SQL_MODE = 'STRICT_ALL_TABLES,NO_ENGINE_SUBSTITUTION';

/* ---------- Crear Base de Datos ---------- */
CREATE DATABASE IF NOT EXISTS `aqua_sonda` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
USE `aqua_sonda`;

/* =========================================================
   1) CATÁLOGOS DE UBICACIÓN (BASE VPS)
   ========================================================= */

CREATE TABLE IF NOT EXISTS `estados` (
  `id_estado` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(120) NOT NULL,
  PRIMARY KEY (`id_estado`),
  UNIQUE KEY `uq_estado_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `municipios` (
  `id_municipio` INT NOT NULL AUTO_INCREMENT,
  `id_estado` INT NOT NULL,
  `nombre` VARCHAR(160) NOT NULL,
  PRIMARY KEY (`id_municipio`),
  KEY `idx_mun_estado` (`id_estado`),
  CONSTRAINT `fk_mun_estado` FOREIGN KEY (`id_estado`)
    REFERENCES `estados` (`id_estado`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY `uq_mun_estado_nombre` (`id_estado`,`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `codigos_postales` (
  `id_cp` INT NOT NULL AUTO_INCREMENT,
  `codigo_postal` VARCHAR(10) NOT NULL,
  `id_municipio` INT NOT NULL,
  PRIMARY KEY (`id_cp`),
  KEY `idx_cp_municipio` (`id_municipio`),
  CONSTRAINT `fk_cp_municipio` FOREIGN KEY (`id_municipio`)
    REFERENCES `municipios` (`id_municipio`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY `uq_cp_mun` (`codigo_postal`,`id_municipio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `colonias` (
  `id_colonia` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(160) NOT NULL,
  `id_cp` INT NOT NULL,
  PRIMARY KEY (`id_colonia`),
  KEY `idx_col_cp` (`id_cp`),
  CONSTRAINT `fk_col_cp` FOREIGN KEY (`id_cp`)
    REFERENCES `codigos_postales` (`id_cp`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY `uq_col_nombre_cp` (`nombre`,`id_cp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* =========================================================
   2) EMPRESAS (BASE VPS) + CAMPOS NUEVOS
   ========================================================= */

CREATE TABLE IF NOT EXISTS `empresa` (
  `id_empresa` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(160) NOT NULL,
  /* nuevos campos */
  `razon_social` VARCHAR(200) DEFAULT NULL,
  `rfc` VARCHAR(20) DEFAULT NULL,
  `regimen_fiscal` VARCHAR(80) DEFAULT NULL,
  `telefono` VARCHAR(30) DEFAULT NULL,
  `correo` VARCHAR(120) DEFAULT NULL,
  `sitio_web` VARCHAR(200) DEFAULT NULL,
  `logo_url` VARCHAR(300) DEFAULT NULL,
  `calle` VARCHAR(160) DEFAULT NULL,
  `num_ext` VARCHAR(20) DEFAULT NULL,
  `num_int` VARCHAR(20) DEFAULT NULL,
  `referencia` VARCHAR(200) DEFAULT NULL,
  `id_estado` INT DEFAULT NULL,
  `id_municipio` INT DEFAULT NULL,
  `id_colonia` INT DEFAULT NULL,
  `codigo_postal` VARCHAR(10) DEFAULT NULL,
  `estado_registro` ENUM('activa','inactiva') NOT NULL DEFAULT 'activa',
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultima_modificacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_empresa`),
  UNIQUE KEY `uq_empresa_nombre` (`nombre`),
  KEY `idx_emp_estado_mun` (`id_estado`,`id_municipio`),
  CONSTRAINT `fk_emp_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_emp_mun` FOREIGN KEY (`id_municipio`) REFERENCES `municipios`(`id_municipio`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_emp_col` FOREIGN KEY (`id_colonia`) REFERENCES `colonias`(`id_colonia`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `empresa_sucursal` (
  `id_empresa_sucursal` INT NOT NULL AUTO_INCREMENT,
  `id_empresa` INT NOT NULL,
  `nombre_sucursal` VARCHAR(160) NOT NULL,
  `telefono` VARCHAR(30) DEFAULT NULL,
  `correo` VARCHAR(120) DEFAULT NULL,
  `calle` VARCHAR(160) DEFAULT NULL,
  `num_ext` VARCHAR(20) DEFAULT NULL,
  `num_int` VARCHAR(20) DEFAULT NULL,
  `referencia` VARCHAR(200) DEFAULT NULL,
  `id_estado` INT DEFAULT NULL,
  `id_municipio` INT DEFAULT NULL,
  `id_colonia` INT DEFAULT NULL,
  `codigo_postal` VARCHAR(10) DEFAULT NULL,
  `latitud` DECIMAL(10,7) DEFAULT NULL,
  `longitud` DECIMAL(10,7) DEFAULT NULL,
  `horario_json` JSON DEFAULT NULL,
  `gerente` VARCHAR(160) DEFAULT NULL,
  /* nuevos */
  `rfc` VARCHAR(20) DEFAULT NULL,
  `regimen_fiscal` VARCHAR(80) DEFAULT NULL,
  `sitio_web` VARCHAR(200) DEFAULT NULL,
  `logo_url` VARCHAR(300) DEFAULT NULL,
  `estado_registro` ENUM('activa','inactiva') NOT NULL DEFAULT 'activa',
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultima_modificacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_empresa_sucursal`),
  KEY `idx_emp_suc_emp` (`id_empresa`),
  KEY `idx_emp_suc_cp` (`codigo_postal`),
  KEY `idx_emp_suc_estado_mun` (`id_estado`,`id_municipio`),
  CONSTRAINT `fk_emp_suc_emp` FOREIGN KEY (`id_empresa`)
    REFERENCES `empresa`(`id_empresa`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_emp_suc_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_emp_suc_mun` FOREIGN KEY (`id_municipio`) REFERENCES `municipios`(`id_municipio`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_emp_suc_col` FOREIGN KEY (`id_colonia`) REFERENCES `colonias`(`id_colonia`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* =========================================================
   3) USUARIOS Y ROLES (BASE VPS)
   ========================================================= */

CREATE TABLE IF NOT EXISTS `tipo_rol` (
  `id_rol` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(80) NOT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `uq_rol_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `usuario` (
  `id_usuario` INT NOT NULL AUTO_INCREMENT,
  `correo` VARCHAR(160) NOT NULL,
  `password_hash` VARCHAR(100) NOT NULL,
  `nombre_completo` VARCHAR(160) NOT NULL,
  `id_rol` INT NOT NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultima_modificacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `uq_usuario_correo` (`correo`),
  KEY `idx_usuario_rol` (`id_rol`),
  CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`id_rol`)
    REFERENCES `tipo_rol`(`id_rol`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Vista de compatibilidad para scripts que esperan 'rol' */
CREATE OR REPLACE VIEW `rol` AS
SELECT `id_rol`,`nombre` FROM `tipo_rol`;

/* =========================================================
   4) INSTALACIONES Y SENSORES (BASE VPS)
   ========================================================= */

CREATE TABLE IF NOT EXISTS `instalacion` (
  `id_instalacion` INT NOT NULL AUTO_INCREMENT,
  `id_empresa_sucursal` INT NOT NULL,
  `nombre_instalacion` VARCHAR(160) NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_instalacion`),
  KEY `idx_ins_sucursal` (`id_empresa_sucursal`),
  CONSTRAINT `fk_ins_sucursal` FOREIGN KEY (`id_empresa_sucursal`)
    REFERENCES `empresa_sucursal`(`id_empresa_sucursal`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `catalogo_sensores` (
  `id_sensor` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(160) NOT NULL,
  `unidad` VARCHAR(40) DEFAULT NULL,
  /* extensiones estilo V4 */
  `tipo_medida` ENUM('temperatura','ph','oxigeno_disuelto','conductividad','turbidez','salinidad','otro') DEFAULT NULL,
  `rango_min` DECIMAL(10,3) DEFAULT NULL,
  `rango_max` DECIMAL(10,3) DEFAULT NULL,
  PRIMARY KEY (`id_sensor`),
  UNIQUE KEY `uq_sensor_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sensor_instalado` (
  `id_sensor_instalado` INT NOT NULL AUTO_INCREMENT,
  `id_instalacion` INT NOT NULL,
  `id_sensor` INT NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  `fecha_instalada` DATE DEFAULT NULL,
  PRIMARY KEY (`id_sensor_instalado`),
  KEY `idx_si_instalacion` (`id_instalacion`),
  KEY `idx_si_sensor` (`id_sensor`),
  CONSTRAINT `fk_si_instalacion` FOREIGN KEY (`id_instalacion`)
    REFERENCES `instalacion`(`id_instalacion`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_si_sensor` FOREIGN KEY (`id_sensor`)
    REFERENCES `catalogo_sensores`(`id_sensor`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Vista de compatibilidad con esquema V4 */
CREATE OR REPLACE VIEW `sensores_instalados` AS
SELECT
  si.id_sensor_instalado,
  si.id_instalacion,
  si.id_sensor AS id_catalogo_sensor,
  NULL AS numero_serie,
  'activo' AS estado,
  CONCAT(IFNULL(si.fecha_instalada, CURRENT_DATE()), ' 00:00:00') AS instalado_en,
  NULL AS retirado_en,
  NULL AS ubicacion,
  NOW() AS fecha_creacion,
  NOW() AS ultima_modificacion
FROM sensor_instalado si;

/* =========================================================
   5) ASIGNACIONES, ALERTAS, RECUPERACIÓN (BASE VPS)
   ========================================================= */

CREATE TABLE IF NOT EXISTS `asignacion_usuario` (
  `id_asignacion` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  /* asignación a sucursal o a instalación (exclusivo) */
  `id_empresa_sucursal` INT DEFAULT NULL,
  `id_instalacion` INT DEFAULT NULL,
  `fecha_asignacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_asignacion`),
  KEY `idx_asig_usuario` (`id_usuario`),
  KEY `idx_asig_sucursal` (`id_empresa_sucursal`),
  KEY `idx_asig_instalacion` (`id_instalacion`),
  CONSTRAINT `fk_asig_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_asig_sucursal` FOREIGN KEY (`id_empresa_sucursal`) REFERENCES `empresa_sucursal`(`id_empresa_sucursal`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_asig_instalacion` FOREIGN KEY (`id_instalacion`) REFERENCES `instalacion`(`id_instalacion`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Validación: solo una de las dos columnas debe llenarse */
DROP TRIGGER IF EXISTS `trg_asignacion_usuario_chk`;
DELIMITER $$
CREATE TRIGGER `trg_asignacion_usuario_chk` 
BEFORE INSERT ON `asignacion_usuario`
FOR EACH ROW
BEGIN
  IF (NEW.id_empresa_sucursal IS NULL AND NEW.id_instalacion IS NULL) 
     OR (NEW.id_empresa_sucursal IS NOT NULL AND NEW.id_instalacion IS NOT NULL) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Debe asignarse EITHER a sucursal OR a instalación (exclusivo)';
  END IF;
END$$
DELIMITER ;

CREATE TABLE IF NOT EXISTS `alertas` (
  `id_alerta` INT NOT NULL AUTO_INCREMENT,
  `id_instalacion` INT NOT NULL,
  `mensaje` VARCHAR(255) NOT NULL,
  `nivel` ENUM('info','warning','critical') NOT NULL DEFAULT 'info',
  `atendida` TINYINT(1) NOT NULL DEFAULT 0,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_alerta`),
  KEY `idx_alerta_instalacion` (`id_instalacion`),
  CONSTRAINT `fk_alerta_instalacion` FOREIGN KEY (`id_instalacion`)
    REFERENCES `instalacion`(`id_instalacion`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `token_recuperacion` (
  `id_token` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `token` VARCHAR(120) NOT NULL,
  `expira_en` DATETIME NOT NULL,
  `usado` TINYINT(1) NOT NULL DEFAULT 0,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_token`),
  UNIQUE KEY `uq_token` (`token`),
  KEY `idx_tok_usuario` (`id_usuario`),
  CONSTRAINT `fk_tok_usuario` FOREIGN KEY (`id_usuario`)
    REFERENCES `usuario`(`id_usuario`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* =========================================================
   6) PARÁMETROS, ESPECIES, PROCESOS (BASE VPS)
   ========================================================= */

CREATE TABLE IF NOT EXISTS `parametros` (
  `id_parametro` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(120) NOT NULL,
  `unidad` VARCHAR(40) DEFAULT NULL,
  PRIMARY KEY (`id_parametro`),
  UNIQUE KEY `uq_parametro_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `especies` (
  `id_especie` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(160) NOT NULL,
  PRIMARY KEY (`id_especie`),
  UNIQUE KEY `uq_especie_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `especie_parametro` (
  `id_especie_parametro` INT NOT NULL AUTO_INCREMENT,
  `id_especie` INT NOT NULL,
  `id_parametro` INT NOT NULL,
  `valor_min` DECIMAL(10,3) DEFAULT NULL,
  `valor_max` DECIMAL(10,3) DEFAULT NULL,
  PRIMARY KEY (`id_especie_parametro`),
  UNIQUE KEY `uq_esparam` (`id_especie`,`id_parametro`),
  CONSTRAINT `fk_esparam_especie` FOREIGN KEY (`id_especie`) REFERENCES `especies`(`id_especie`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_esparam_param` FOREIGN KEY (`id_parametro`) REFERENCES `parametros`(`id_parametro`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `procesos` (
  `id_proceso` INT NOT NULL AUTO_INCREMENT,
  `id_instalacion` INT NOT NULL,
  `id_especie` INT DEFAULT NULL,
  `nombre` VARCHAR(160) NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  `fecha_inicio` DATE DEFAULT NULL,
  `fecha_fin` DATE DEFAULT NULL,
  `estado` ENUM('activo','pausado','finalizado') NOT NULL DEFAULT 'activo',
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_proceso`),
  KEY `idx_proc_ins` (`id_instalacion`),
  KEY `idx_proc_especie` (`id_especie`),
  CONSTRAINT `fk_proc_ins` FOREIGN KEY (`id_instalacion`) REFERENCES `instalacion`(`id_instalacion`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_proc_especie` FOREIGN KEY (`id_especie`) REFERENCES `especies`(`id_especie`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* =========================================================
   7) LECTURAS + AGREGADOS (BASE VPS)
   ========================================================= */

CREATE TABLE IF NOT EXISTS `lectura` (
  `id_lectura` BIGINT NOT NULL AUTO_INCREMENT,
  `id_sensor_instalado` INT NOT NULL,
  `valor` DECIMAL(12,4) NOT NULL,
  `tomada_en` DATETIME NOT NULL,
  PRIMARY KEY (`id_lectura`),
  KEY `idx_lectura_sensor_fecha` (`id_sensor_instalado`,`tomada_en`),
  CONSTRAINT `fk_lectura_sensor_instalado` FOREIGN KEY (`id_sensor_instalado`)
    REFERENCES `sensor_instalado`(`id_sensor_instalado`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Promedio por hora/sensor */
CREATE TABLE IF NOT EXISTS `promedio` (
  `id_sensor_instalado` INT NOT NULL,
  `anio` SMALLINT NOT NULL,
  `mes` TINYINT NOT NULL,
  `dia` TINYINT NOT NULL,
  `hora` TINYINT NOT NULL,
  `conteo` INT NOT NULL DEFAULT 0,
  `suma` DECIMAL(20,6) NOT NULL DEFAULT 0,
  `promedio` DECIMAL(20,6) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_sensor_instalado`,`anio`,`mes`,`dia`,`hora`),
  KEY `idx_prom_sensor_fecha` (`id_sensor_instalado`,`anio`,`mes`,`dia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Resumen horario (rápido para dashboard) */
CREATE TABLE IF NOT EXISTS `resumen_lectura_horaria` (
  `id_sensor_instalado` INT NOT NULL,
  `fecha_hora` DATETIME NOT NULL,
  `min_val` DECIMAL(20,6) NOT NULL,
  `max_val` DECIMAL(20,6) NOT NULL,
  `avg_val` DECIMAL(20,6) NOT NULL,
  `cnt` INT NOT NULL,
  PRIMARY KEY (`id_sensor_instalado`,`fecha_hora`),
  KEY `idx_res_hora_sensor` (`id_sensor_instalado`,`fecha_hora`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Triggers de agregación */
DROP TRIGGER IF EXISTS `trg_lectura_promedio_insert`;
DELIMITER $$
CREATE TRIGGER `trg_lectura_promedio_insert`
AFTER INSERT ON `lectura`
FOR EACH ROW
BEGIN
  /* descomponer fecha/hora */
  SET @y := YEAR(NEW.tomada_en);
  SET @m := MONTH(NEW.tomada_en);
  SET @d := DAY(NEW.tomada_en);
  SET @h := HOUR(NEW.tomada_en);

  /* upsert promedio */
  INSERT INTO promedio (`id_sensor_instalado`,`anio`,`mes`,`dia`,`hora`,`conteo`,`suma`,`promedio`)
  VALUES (NEW.id_sensor_instalado,@y,@m,@d,@h,1,NEW.valor,NEW.valor)
  ON DUPLICATE KEY UPDATE
    conteo = conteo + 1,
    suma   = suma + VALUES(suma),
    promedio = (suma + VALUES(suma)) / (conteo + 1);

  /* resumen_lectura_horaria con redondeo a la hora exacta */
  SET @slot := CONCAT(DATE_FORMAT(NEW.tomada_en, '%Y-%m-%d %H'), ':00:00');
  INSERT INTO resumen_lectura_horaria (`id_sensor_instalado`,`fecha_hora`,`min_val`,`max_val`,`avg_val`,`cnt`)
  VALUES (NEW.id_sensor_instalado, @slot, NEW.valor, NEW.valor, NEW.valor, 1)
  ON DUPLICATE KEY UPDATE
    min_val = LEAST(min_val, VALUES(min_val)),
    max_val = GREATEST(max_val, VALUES(max_val)),
    avg_val = ((avg_val * cnt) + VALUES(avg_val)) / (cnt + 1),
    cnt = cnt + 1;
END$$
DELIMITER ;

/* =========================================================
   8) ORGANIZACIONES (INTEGRACIÓN BD NUEVA) + VISTAS
   ========================================================= */

CREATE TABLE IF NOT EXISTS `organizacion` (
  `id_organizacion` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(160) NOT NULL,
  `razon_social` VARCHAR(200) DEFAULT NULL,
  `rfc` VARCHAR(20) DEFAULT NULL,
  `regimen_fiscal` VARCHAR(80) DEFAULT NULL,
  `telefono` VARCHAR(30) DEFAULT NULL,
  `correo` VARCHAR(120) DEFAULT NULL,
  `sitio_web` VARCHAR(200) DEFAULT NULL,
  `logo_url` VARCHAR(300) DEFAULT NULL,
  `calle` VARCHAR(160) DEFAULT NULL,
  `num_ext` VARCHAR(20) DEFAULT NULL,
  `num_int` VARCHAR(20) DEFAULT NULL,
  `referencia` VARCHAR(200) DEFAULT NULL,
  `id_estado` INT DEFAULT NULL,
  `id_municipio` INT DEFAULT NULL,
  `id_colonia` INT DEFAULT NULL,
  `codigo_postal` VARCHAR(10) DEFAULT NULL,
  `estado` ENUM('activa','inactiva') NOT NULL DEFAULT 'activa',
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultima_modificacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_organizacion`),
  UNIQUE KEY `uq_org_nombre` (`nombre`),
  KEY `idx_org_estado_mun` (`id_estado`,`id_municipio`),
  CONSTRAINT `fk_org_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_org_mun` FOREIGN KEY (`id_municipio`) REFERENCES `municipios`(`id_municipio`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_org_col` FOREIGN KEY (`id_colonia`) REFERENCES `colonias`(`id_colonia`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `organizacion_sucursal` (
  `id_organizacion_sucursal` INT NOT NULL AUTO_INCREMENT,
  `id_organizacion` INT NOT NULL,
  `nombre_sucursal` VARCHAR(160) NOT NULL,
  `telefono` VARCHAR(30) DEFAULT NULL,
  `correo` VARCHAR(120) DEFAULT NULL,
  `calle` VARCHAR(160) DEFAULT NULL,
  `num_ext` VARCHAR(20) DEFAULT NULL,
  `num_int` VARCHAR(20) DEFAULT NULL,
  `referencia` VARCHAR(200) DEFAULT NULL,
  `id_estado` INT DEFAULT NULL,
  `id_municipio` INT DEFAULT NULL,
  `id_colonia` INT DEFAULT NULL,
  `codigo_postal` VARCHAR(10) DEFAULT NULL,
  `latitud` DECIMAL(10,7) DEFAULT NULL,
  `longitud` DECIMAL(10,7) DEFAULT NULL,
  `horario_json` JSON DEFAULT NULL,
  `gerente` VARCHAR(160) DEFAULT NULL,
  `estado` ENUM('activa','inactiva') NOT NULL DEFAULT 'activa',
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultima_modificacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_organizacion_sucursal`),
  KEY `idx_orgsuc_org` (`id_organizacion`),
  CONSTRAINT `fk_orgsuc_org` FOREIGN KEY (`id_organizacion`)
    REFERENCES `organizacion`(`id_organizacion`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_orgsuc_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_orgsuc_mun` FOREIGN KEY (`id_municipio`) REFERENCES `municipios`(`id_municipio`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_orgsuc_col` FOREIGN KEY (`id_colonia`) REFERENCES `colonias`(`id_colonia`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Vistas de compatibilidad con nombres de la BD nueva */
CREATE OR REPLACE VIEW `organizaciones` AS
SELECT
  o.id_organizacion, o.nombre, o.razon_social, o.rfc, o.regimen_fiscal,
  o.telefono, o.correo, o.sitio_web, o.logo_url,
  o.calle, o.num_ext, o.num_int, o.referencia,
  o.id_estado, o.id_municipio, o.id_colonia, o.codigo_postal,
  o.estado, o.fecha_creacion, o.ultima_modificacion
FROM `organizacion` o;

CREATE OR REPLACE VIEW `organizaciones_sucursales` AS
SELECT
  s.id_organizacion_sucursal, s.id_organizacion, s.nombre_sucursal,
  s.telefono, s.correo,
  s.calle, s.num_ext, s.num_int, s.referencia,
  s.id_estado, s.id_municipio, s.id_colonia, s.codigo_postal,
  s.latitud, s.longitud, s.horario_json, s.gerente,
  s.estado, s.fecha_creacion, s.ultima_modificacion
FROM `organizacion_sucursal` s;

/* =========================================================
   9) MÓDULO BIOLÓGICO (ÚTIL DE V4, SIN ROMPER LO ACTUAL)
   ========================================================= */

CREATE TABLE IF NOT EXISTS `catalogo_especies` (
  `id_especie` INT NOT NULL AUTO_INCREMENT,
  `nombre_comun` VARCHAR(120) NOT NULL,
  `nombre_cientifico` VARCHAR(160) DEFAULT NULL,
  `notas` VARCHAR(255) DEFAULT NULL,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultima_modificacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_especie`),
  UNIQUE KEY `uq_ce_nombre_comun` (`nombre_comun`),
  UNIQUE KEY `uq_ce_nombre_cientifico` (`nombre_cientifico`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `especies_instaladas` (
  `id_especie_instalada` INT NOT NULL AUTO_INCREMENT,
  `id_instalacion` INT NOT NULL,
  `id_especie` INT NOT NULL, /* del catalogo_especies */
  `estado` ENUM('activo','retirado') NOT NULL DEFAULT 'activo',
  `fecha_introduccion` DATE NOT NULL,
  `fecha_retiro` DATE DEFAULT NULL,
  `individuos` INT DEFAULT NULL,
  `biomasa_kg` DECIMAL(10,2) DEFAULT NULL,
  `notas` VARCHAR(255) DEFAULT NULL,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultima_modificacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_especie_instalada`),
  KEY `idx_ei_instalacion` (`id_instalacion`),
  KEY `idx_ei_especie` (`id_especie`),
  CONSTRAINT `fk_ei_instalacion` FOREIGN KEY (`id_instalacion`) REFERENCES `instalacion`(`id_instalacion`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ei_especie_ce` FOREIGN KEY (`id_especie`) REFERENCES `catalogo_especies`(`id_especie`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `especie_tracking` (
  `id_tracking` INT NOT NULL AUTO_INCREMENT,
  `id_especie_instalada` INT NOT NULL,
  `fecha` DATE NOT NULL,
  `individuos` INT DEFAULT NULL,
  `biomasa_kg` DECIMAL(10,2) DEFAULT NULL,
  `notas` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id_tracking`),
  KEY `idx_et_especie_instalada` (`id_especie_instalada`),
  KEY `idx_et_fecha` (`fecha`),
  CONSTRAINT `fk_et_ei` FOREIGN KEY (`id_especie_instalada`) REFERENCES `especies_instaladas`(`id_especie_instalada`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* Vista de apoyo (ajustada a tu esquema) */
CREATE OR REPLACE VIEW `v_especie_en_instalacion` AS
SELECT
  ei.id_especie_instalada,
  i.id_instalacion,
  i.nombre_instalacion,
  ce.id_especie,
  ce.nombre_comun,
  ei.estado,
  ei.fecha_introduccion,
  ei.fecha_retiro,
  ei.individuos,
  ei.biomasa_kg
FROM especies_instaladas ei
JOIN instalacion i ON i.id_instalacion = ei.id_instalacion
JOIN catalogo_especies ce ON ce.id_especie = ei.id_especie;

/* =========================================================
   10) ÍNDICES AUXILIARES
   ========================================================= */

CREATE INDEX IF NOT EXISTS `idx_lectura_fecha` ON `lectura` (`tomada_en`);
/* Nota: MySQL 5.7 no soporta IF NOT EXISTS en CREATE INDEX standalone;
   si tu versión no lo admite, ignora el error benigno o bórralo. */

/* =========================================================
   FIN
   ========================================================= */

SET SQL_MODE = @OLD_SQL_MODE;
