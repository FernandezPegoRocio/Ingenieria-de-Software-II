#!/usr/bin/env bash
# =============================================================================
# build.sh  —  Script de compilación para Intraned (proyecto servidor C++)
# =============================================================================
# Flujo:
#   1. (Primera vez o --rebuild-libs) Compila libhttplib.so y libjson.so
#      en server/lib/. Estas compilaciones son lentas pero ocurren una sola vez.
#   2. Compila main.cpp enlazando contra esas .so → binario "servidor"
#      Esta compilación es rápida en todos los rebuilds normales.
# =============================================================================

set -euo pipefail

# ── Configuración ─────────────────────────────────────────────────────────────
CXX="${CXX:-g++}"
STD="-std=c++17"
OPT="-O2"
WARN="-Wall -Wextra"

SERVER_DIR="$(cd "$(dirname "$0")/server" && pwd)"
LIB_DIR="${SERVER_DIR}/lib"
INCLUDE_DIR="${SERVER_DIR}/include"
OUTPUT="${SERVER_DIR}/../servidor"   # binario final en raíz del proyecto

REBUILD_LIBS=false

# Permitir forzar recompilación de libs con: ./build.sh --rebuild-libs
for arg in "$@"; do
    [[ "$arg" == "--rebuild-libs" ]] && REBUILD_LIBS=true
done

# ── Utilidades ────────────────────────────────────────────────────────────────
info()  { echo -e "\033[1;34m[build]\033[0m $*"; }
ok()    { echo -e "\033[1;32m[  OK ]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[ WARN]\033[0m $*"; }

# ── 1. Crear directorio de libs si no existe ──────────────────────────────────
mkdir -p "${LIB_DIR}"

# ── 2. Compilar libjson.so (solo si no existe o se pide rebuild) ──────────────
JSON_SO="${LIB_DIR}/libjson.so"
JSON_SRC="${LIB_DIR}/json_lib.cpp"

if [[ ! -f "${JSON_SO}" || "${REBUILD_LIBS}" == true ]]; then
    info "Compilando libjson.so (primera vez, puede tardar)..."
    "${CXX}" ${STD} ${OPT} -fPIC -shared \
        -I"${INCLUDE_DIR}" \
        "${JSON_SRC}" \
        -o "${JSON_SO}"
    ok "libjson.so generada en ${LIB_DIR}"
else
    info "libjson.so ya existe, omitiendo. (Usar --rebuild-libs para forzar)"
fi

# ── 3. Compilar libhttplib.so (solo si no existe o se pide rebuild) ───────────
HTTPLIB_SO="${LIB_DIR}/libhttplib.so"
HTTPLIB_SRC="${LIB_DIR}/httplib_lib.cpp"

if [[ ! -f "${HTTPLIB_SO}" || "${REBUILD_LIBS}" == true ]]; then
    info "Compilando libhttplib.so (primera vez, puede tardar)..."
    "${CXX}" ${STD} ${OPT} -fPIC -shared \
        -DCPPHTTPLIB_COMPILE \
        -I"${INCLUDE_DIR}" \
        "${HTTPLIB_SRC}" \
        -lpthread \
        -o "${HTTPLIB_SO}"
    ok "libhttplib.so generada en ${LIB_DIR}"
else
    info "libhttplib.so ya existe, omitiendo. (Usar --rebuild-libs para forzar)"
fi

# ── 4. Compilar main.cpp (rápido en cada rebuild normal) ─────────────────────
info "Compilando main.cpp..."
"${CXX}" ${STD} ${OPT} ${WARN} \
    -DCPPHTTPLIB_COMPILE \
    -I"${INCLUDE_DIR}" \
    "${SERVER_DIR}/main.cpp" \
    -L"${LIB_DIR}" \
    -lhttplib \
    -ljson \
    -lpthread \
    -Wl,-rpath,"${LIB_DIR}" \
    -o "${OUTPUT}"

ok "Binario generado: ${OUTPUT}"
echo ""
echo "Para ejecutar:"
echo "  ./servidor"
echo ""
echo "Si el sistema no encuentra las .so en runtime, exportá:"
echo "  export LD_LIBRARY_PATH=\"${LIB_DIR}:\$LD_LIBRARY_PATH\""