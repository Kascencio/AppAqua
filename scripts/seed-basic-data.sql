-- ================================================
-- BASIC SEED DATA FOR DEVELOPMENT
-- Insert essential data for AppAqua development
-- ================================================

-- Insert basic roles
INSERT INTO `tipo_rol` (`nombre`) VALUES 
('admin'),
('operador'), 
('lector')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- Insert basic estados (some Mexican states)
INSERT INTO `estados` (`nombre`) VALUES
('Aguascalientes'),
('Baja California'),
('Baja California Sur'),
('Campeche'),
('Chiapas'),
('Chihuahua'),
('Ciudad de México'),
('Coahuila'),
('Colima'),
('Durango'),
('Guanajuato'),
('Guerrero'),
('Hidalgo'),
('Jalisco'),
('México'),
('Michoacán'),
('Morelos'),
('Nayarit'),
('Nuevo León'),
('Oaxaca'),
('Puebla'),
('Querétaro'),
('Quintana Roo'),
('San Luis Potosí'),
('Sinaloa'),
('Sonora'),
('Tabasco'),
('Tamaulipas'),
('Tlaxcala'),
('Veracruz'),
('Yucatán'),
('Zacatecas')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- Insert some municipalities for development (Jalisco example)
INSERT INTO `municipios` (`id_estado`, `nombre`) 
SELECT e.id_estado, m.nombre FROM `estados` e
CROSS JOIN (
  SELECT 'Guadalajara' as nombre UNION ALL
  SELECT 'Zapopan' UNION ALL
  SELECT 'Tlaquepaque' UNION ALL
  SELECT 'Tonalá' UNION ALL
  SELECT 'Tlajomulco de Zúñiga'
) m WHERE e.nombre = 'Jalisco'
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- Insert basic sensor catalog
INSERT INTO `catalogo_sensores` (`nombre`, `unidad`, `tipo_medida`, `rango_min`, `rango_max`) VALUES
('Sensor de Temperatura Digital', '°C', 'temperatura', -10.000, 50.000),
('Medidor de pH Digital', 'pH', 'ph', 0.000, 14.000),
('Sensor de Oxígeno Disuelto', 'mg/L', 'oxigeno_disuelto', 0.000, 20.000),
('Conductímetro Digital', 'µS/cm', 'conductividad', 0.000, 50000.000),
('Turbidímetro', 'NTU', 'turbidez', 0.000, 4000.000),
('Salinómetro', 'ppt', 'salinidad', 0.000, 50.000)
ON DUPLICATE KEY UPDATE 
  `unidad` = VALUES(`unidad`),
  `tipo_medida` = VALUES(`tipo_medida`),
  `rango_min` = VALUES(`rango_min`),
  `rango_max` = VALUES(`rango_max`);

-- Insert basic parameters
INSERT INTO `parametros` (`nombre`, `unidad`) VALUES
('Temperatura', '°C'),
('pH', 'unidades'),
('Oxígeno Disuelto', 'mg/L'),
('Conductividad', 'µS/cm'),
('Turbidez', 'NTU'),
('Salinidad', 'ppt'),
('Amonio', 'mg/L'),
('Nitritos', 'mg/L'),
('Nitratos', 'mg/L'),
('Fosfatos', 'mg/L')
ON DUPLICATE KEY UPDATE 
  `unidad` = VALUES(`unidad`);

-- Insert basic species
INSERT INTO `especies` (`nombre`) VALUES
('Tilapia del Nilo'),
('Carpa Común'),
('Trucha Arcoíris'),
('Bagre de Canal'),
('Camarón Blanco'),
('Ostión Japonés')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- Insert basic biological species catalog
INSERT INTO `catalogo_especies` (`nombre_comun`, `nombre_cientifico`, `notas`) VALUES
('Tilapia del Nilo', 'Oreochromis niloticus', 'Especie de pez de agua dulce, muy resistente'),
('Carpa Común', 'Cyprinus carpio', 'Pez omnívoro, adaptable a diferentes condiciones'),
('Trucha Arcoíris', 'Oncorhynchus mykiss', 'Pez de agua fría, requiere alta calidad del agua'),
('Bagre de Canal', 'Ictalurus punctatus', 'Pez de fondo, tolerante a bajas concentraciones de oxígeno'),
('Camarón Blanco', 'Litopenaeus vannamei', 'Crustáceo marino, cultivo en agua salobre'),
('Ostión Japonés', 'Crassostrea gigas', 'Molusco bivalvo, filtrador, mejora calidad del agua')
ON DUPLICATE KEY UPDATE 
  `nombre_cientifico` = VALUES(`nombre_cientifico`),
  `notas` = VALUES(`notas`);

-- Create default admin user (password: admin123 - hashed with bcrypt)
-- Note: Change password immediately in production!
INSERT INTO `usuario` (`correo`, `password_hash`, `nombre_completo`, `id_rol`, `activo`) 
SELECT 
  'admin@aquasonda.com', 
  '$2b$12$LQv3c1yqBwlVHpPjrh8upe6XM1WZLpSb/r9.AddCd7DG/XHHjNUWu', -- admin123
  'Administrador del Sistema',
  tr.id_rol,
  1
FROM `tipo_rol` tr WHERE tr.nombre = 'admin'
ON DUPLICATE KEY UPDATE 
  `nombre_completo` = VALUES(`nombre_completo`);

-- Create sample organizacion for development
INSERT INTO `organizacion` (
  `nombre`, 
  `razon_social`, 
  `rfc`, 
  `correo`, 
  `telefono`, 
  `estado`
) VALUES (
  'AquaTech Demo', 
  'AquaTech Soluciones Integrales S.A. de C.V.', 
  'ATS123456789', 
  'contacto@aquatech-demo.com', 
  '+52 33 1234 5678', 
  'activa'
) ON DUPLICATE KEY UPDATE 
  `razon_social` = VALUES(`razon_social`);

-- Link some species with parameters (basic ranges for Tilapia)
INSERT INTO `especie_parametro` (`id_especie`, `id_parametro`, `valor_min`, `valor_max`)
SELECT 
  e.id_especie,
  p.id_parametro,
  CASE 
    WHEN p.nombre = 'Temperatura' THEN 20.000
    WHEN p.nombre = 'pH' THEN 6.500
    WHEN p.nombre = 'Oxígeno Disuelto' THEN 4.000
    WHEN p.nombre = 'Amonio' THEN 0.000
    ELSE 0.000
  END as valor_min,
  CASE 
    WHEN p.nombre = 'Temperatura' THEN 32.000
    WHEN p.nombre = 'pH' THEN 8.500
    WHEN p.nombre = 'Oxígeno Disuelto' THEN 20.000
    WHEN p.nombre = 'Amonio' THEN 1.000
    ELSE 100.000
  END as valor_max
FROM `especies` e
CROSS JOIN `parametros` p
WHERE e.nombre = 'Tilapia del Nilo'
  AND p.nombre IN ('Temperatura', 'pH', 'Oxígeno Disuelto', 'Amonio')
ON DUPLICATE KEY UPDATE 
  `valor_min` = VALUES(`valor_min`),
  `valor_max` = VALUES(`valor_max`);

-- Insert some postal codes for Guadalajara (development)
INSERT INTO `codigos_postales` (`codigo_postal`, `id_municipio`)
SELECT '44100', m.id_municipio FROM `municipios` m 
JOIN `estados` e ON e.id_estado = m.id_estado
WHERE m.nombre = 'Guadalajara' AND e.nombre = 'Jalisco'
LIMIT 1
ON DUPLICATE KEY UPDATE `codigo_postal` = VALUES(`codigo_postal`);

INSERT INTO `codigos_postales` (`codigo_postal`, `id_municipio`)
SELECT '45019', m.id_municipio FROM `municipios` m 
JOIN `estados` e ON e.id_estado = m.id_estado
WHERE m.nombre = 'Zapopan' AND e.nombre = 'Jalisco'
LIMIT 1
ON DUPLICATE KEY UPDATE `codigo_postal` = VALUES(`codigo_postal`);

-- Insert basic colonies
INSERT INTO `colonias` (`nombre`, `id_cp`)
SELECT 'Centro', cp.id_cp FROM `codigos_postales` cp
JOIN `municipios` m ON m.id_municipio = cp.id_municipio
JOIN `estados` e ON e.id_estado = m.id_estado
WHERE cp.codigo_postal = '44100' AND m.nombre = 'Guadalajara' AND e.nombre = 'Jalisco'
LIMIT 1
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

INSERT INTO `colonias` (`nombre`, `id_cp`)
SELECT 'Providencia', cp.id_cp FROM `codigos_postales` cp
JOIN `municipios` m ON m.id_municipio = cp.id_municipio
JOIN `estados` e ON e.id_estado = m.id_estado
WHERE cp.codigo_postal = '45019' AND m.nombre = 'Zapopan' AND e.nombre = 'Jalisco'
LIMIT 1
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);