/**
 * @file hilos.cpp
 * @brief PUNTO 4 (solo Linux / WSL): muestra con ThreadSanitizer por qué el map_mutex_ es necesario.
 * @details El mismo trabajo de hilos se ejecuta contra dos gestores:
 *   - ModuleManager original (con std::mutex)              -> ThreadSanitizer no informa nada
 *   - ModuleManagerSinMutex (misma clase, sin los bloqueos) -> ThreadSanitizer informa una "data race"
 * Se elige con -DSIN_MUTEX al compilar.
 */

#ifdef SIN_MUTEX
    #include "module_manager_sin_mutex.hpp"
    using Gestor = ModuleManagerSinMutex;
    static const char* NOMBRE = "ModuleManagerSinMutex (SIN mutex)";
#else
    #include "../include/module_manager.hpp"
    using Gestor = ModuleManager;
    static const char* NOMBRE = "ModuleManager original (CON mutex)";
#endif

#include "../include/i_greeter.hpp"
#include <atomic>
#include <cstdio>
#include <thread>
#include <vector>

int main()
{
    setenv("SEGUIMIENTO_SILENCIO", "1", 1);   // sin trazas, solo el resultado de TSan

    const int HILOS = 8;
    const int ITERACIONES = 25;

    Gestor gestor;
    gestor.load_module("./lib/greeter");

    std::atomic<int> exitosas(0);
    std::vector<std::thread> hilos;
    for (int h = 0; h < HILOS; ++h)
    {
        hilos.emplace_back([&gestor, &exitosas, ITERACIONES]()
        {
            for (int i = 0; i < ITERACIONES; ++i)
            {
                try
                {
                    gestor.load_module("./lib/greeter");
                    auto saludador = gestor.create_instance<IGreeter>("greeter");
                    char salida[64];
                    if (saludador->greet("Rocio", salida, sizeof(salida)) == ComponentResult::SUCCESS) ++exitosas;
                }
                catch (...) { }
            }
        });
    }
    for (auto& hilo : hilos) hilo.join();

    std::printf("%s: %d de %d operaciones terminaron bien\n", NOMBRE, exitosas.load(), HILOS * ITERACIONES);
    return exitosas == HILOS * ITERACIONES ? 0 : 1;
}
