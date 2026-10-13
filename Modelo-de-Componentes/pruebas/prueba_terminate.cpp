/**
 * @file prueba_terminate.cpp
 * @brief PUNTO 1 (noexcept): qué pasa si una excepción intenta escapar de un componente.
 * @details Carga lib/sin_catch, cuyo greet() es noexcept pero lanza sin atrapar.
 * El programa DEBE terminar de golpe con std::terminate (no sigue de largo).
 */

#include "../include/module_manager.hpp"
#include "../include/i_greeter.hpp"
#include <iostream>

int main()
{
    ModuleManager gestor;
    gestor.load_module("./lib/sin_catch");
    auto saludador = gestor.create_instance<IGreeter>("sin_catch");

    char salida[16];
    std::cout << "Llamo a greet(): el componente lanza una excepción sin atraparla..." << std::endl;
    saludador->greet("x", salida, sizeof(salida));

    std::cout << "ESTA LÍNEA NO DEBERÍA IMPRIMIRSE" << std::endl;
    return 0;
}
