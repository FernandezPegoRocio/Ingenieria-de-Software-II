/**
 * @file httplib_lib.cpp
 * @brief Wrapper para compilar cpp-httplib como biblioteca dinámica.
 *
 * Compilar una sola vez:
 *   g++ -O2 -std=c++17 -fPIC -shared -I../include -o libhttplib.so httplib_lib.cpp -lpthread
 *
 * Nota: cpp-httplib requiere la macro CPPHTTPLIB_COMPILE para separar
 * declaraciones de implementación. Sin ella, todo el código queda inline
 * y no se puede aislar en una .so de forma limpia.
 * Con CPPHTTPLIB_COMPILE definido:
 *   - Este archivo compila TODA la implementación.
 *   - main.cpp (y otros) incluyen httplib.h con CPPHTTPLIB_COMPILE definido
 *     también, pero solo ven las declaraciones (el enlazador resuelve el resto).
 */

#define CPPHTTPLIB_COMPILE
#include "../include/httplib.h"