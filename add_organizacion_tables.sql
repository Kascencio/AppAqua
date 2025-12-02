-- Create organizacion tables
CREATE TABLE IF NOT EXISTS `organizacion` (
  `id_organizacion` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `razon_social` VARCHAR(255) NULL,
  `rfc` VARCHAR(13) NULL,
  `correo` VARCHAR(255) NULL,
  `telefono` VARCHAR(15) NULL,
  `direccion` TEXT NULL,
  `id_estado` INT NULL,
  `id_municipio` INT NULL,
  `estado` ENUM('activa', 'inactiva') NOT NULL DEFAULT 'activa',
  `descripcion` TEXT NULL,
  `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultima_modificacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_organizacion`),
  INDEX `idx_organizacion_estado` (`id_estado`),
  INDEX `idx_organizacion_municipio` (`id_municipio`),
  INDEX `idx_organizacion_rfc` (`rfc`),
  INDEX `idx_organizacion_correo` (`correo`),
  CONSTRAINT `fk_organizacion_estado`
    FOREIGN KEY (`id_estado`)
    REFERENCES `estados` (`id_estado`)
    ON UPDATE RESTRICT,
  CONSTRAINT `fk_organizacion_municipio`
    FOREIGN KEY (`id_municipio`)
    REFERENCES `municipios` (`id_municipio`)
    ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `organizacion_sucursal` (
  `id_organizacion_sucursal` INT NOT NULL AUTO_INCREMENT,
  `id_organizacion` INT NOT NULL,
  `nombre_sucursal` VARCHAR(100) NOT NULL,
  `direccion_sucursal` TEXT NULL,
  `telefono_sucursal` VARCHAR(15) NULL,
  `correo_sucursal` VARCHAR(255) NULL,
  `id_estado` INT NULL,
  `id_municipio` INT NULL,
  `estado` ENUM('activa', 'inactiva') NOT NULL DEFAULT 'activa',
  `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultima_modificacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_organizacion_sucursal`),
  INDEX `idx_organizacion_sucursal_org` (`id_organizacion`),
  INDEX `idx_organizacion_sucursal_estado` (`id_estado`),
  INDEX `idx_organizacion_sucursal_municipio` (`id_municipio`),
  CONSTRAINT `fk_organizacion_sucursal_organizacion`
    FOREIGN KEY (`id_organizacion`)
    REFERENCES `organizacion` (`id_organizacion`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT,
  CONSTRAINT `fk_organizacion_sucursal_estado`
    FOREIGN KEY (`id_estado`)
    REFERENCES `estados` (`id_estado`)
    ON UPDATE RESTRICT,
  CONSTRAINT `fk_organizacion_sucursal_municipio`
    FOREIGN KEY (`id_municipio`)
    REFERENCES `municipios` (`id_municipio`)
    ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;