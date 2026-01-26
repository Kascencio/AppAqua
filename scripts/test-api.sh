#!/bin/bash

# Script de pruebas usando curl para verificar endpoints del backend

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# URL del backend
BACKEND_URL="http://195.35.11.179:3300"

# Contadores
TOTAL=0
PASSED=0
FAILED=0

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         PRUEBAS DE API - BACKEND AQUA MONITOR            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo -e "${BLUE}ℹ️  Backend URL: $BACKEND_URL${NC}"
echo -e "${BLUE}ℹ️  Fecha: $(date)${NC}\n"

# Función para hacer pruebas
test_endpoint() {
    local name=$1
    local endpoint=$2
    local method=${3:-GET}
    
    TOTAL=$((TOTAL + 1))
    echo -e "${CYAN}============================================================${NC}"
    echo -e "${CYAN}  $name${NC}"
    echo -e "${CYAN}============================================================${NC}"
    echo -e "${BLUE}ℹ️  Probando endpoint: $method $endpoint${NC}"
    
    response=$(curl -s -w "\n%{http_code}" -X $method "$BACKEND_URL$endpoint" 2>&1)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✅ Exitoso (HTTP $http_code)${NC}"
        PASSED=$((PASSED + 1))
        
        # Mostrar información relevante del JSON
        if command -v jq &> /dev/null; then
            total=$(echo "$body" | jq -r '.pagination.total // .data | length // 0' 2>/dev/null)
            echo -e "${CYAN}   Total de registros: $total${NC}"
            
            # Mostrar primer registro si existe
            first=$(echo "$body" | jq -r '.data[0] // empty' 2>/dev/null)
            if [ ! -z "$first" ]; then
                echo -e "${CYAN}   Primer registro:${NC}"
                echo "$first" | jq -C '.' 2>/dev/null | head -5
            fi
        else
            echo "$body" | head -3
        fi
    else
        echo -e "${RED}❌ Fallido (HTTP $http_code)${NC}"
        FAILED=$((FAILED + 1))
        echo -e "${RED}   Respuesta: $body${NC}" | head -3
    fi
    echo ""
}

# Ejecutar pruebas
echo -e "\n${CYAN}Iniciando pruebas de endpoints...${NC}\n"

# Prueba 1: Organizaciones
test_endpoint "PRUEBA 1: ORGANIZACIONES" "/api/organizaciones?page=1&limit=10"

# Prueba 2: Sucursales
test_endpoint "PRUEBA 2: SUCURSALES" "/api/sucursales?page=1&limit=10"

# Prueba 3: Instalaciones
test_endpoint "PRUEBA 3: INSTALACIONES" "/api/instalaciones?page=1&limit=10"

# Prueba 4: Sensores Instalados
test_endpoint "PRUEBA 4: SENSORES INSTALADOS" "/api/sensores-instalados?page=1&limit=10"

# Prueba 5: Especies (Catálogo)
test_endpoint "PRUEBA 5: ESPECIES (CATÁLOGO)" "/api/catalogo-especies?page=1&limit=10"

# Prueba 6: Procesos
test_endpoint "PRUEBA 6: PROCESOS" "/api/procesos?page=1&limit=10"

# Prueba 7: Lecturas (con sensorInstaladoId obligatorio en camelCase)
# Primero obtener un sensor ID válido
SENSOR_ID=$(curl -s "http://195.35.11.179:3300/api/sensores-instalados?page=1&limit=1" | jq -r '.[0].id_sensor_instalado // 1')
DESDE=$(date -u -v-7d +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -d "7 days ago" +"%Y-%m-%dT%H:%M:%S.000Z")
HASTA=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
test_endpoint "PRUEBA 7: LECTURAS (Sensor $SENSOR_ID)" "/api/lecturas?sensorInstaladoId=$SENSOR_ID&page=1&limit=100&desde=$DESDE&hasta=$HASTA"

# Prueba 8: Health Check
test_endpoint "PRUEBA 8: HEALTH CHECK" "/health"

# Resumen
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}  RESUMEN DE PRUEBAS${NC}"
echo -e "${CYAN}============================================================${NC}"
echo -e "\n${CYAN}Total de pruebas: $TOTAL${NC}"
echo -e "${GREEN}✅ Exitosas: $PASSED${NC}"
echo -e "${RED}❌ Fallidas: $FAILED${NC}"

if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED/$TOTAL)*100}")
    echo -e "\n${CYAN}Tasa de éxito: $SUCCESS_RATE%${NC}"
fi

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ¡Todas las pruebas pasaron exitosamente!${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  $FAILED prueba(s) fallaron. Revisa los errores arriba.${NC}"
    exit 1
fi
