/**
 * @file json_lib.cpp
 * @brief Wrapper para compilar nlohmann/json como biblioteca dinámica.
 *
 * Compilar una sola vez:
 *   g++ -O2 -std=c++17 -fPIC -shared -I../include -o libjson.so json_lib.cpp
 */

// Forzamos que json.hpp compile aquí (y solo aquí) toda su implementación.
// En los demás translation units se usará solo la declaración (vía el header normal).
#include "../include/json.hpp"

// Nada más es necesario: json.hpp es header-only y con esto queda compilado
// dentro de libjson.so. Los demás .cpp solo incluyen el header y enlazan contra .so.