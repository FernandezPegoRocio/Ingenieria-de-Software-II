/**
 * @file seguimiento.hpp
 * @brief Trazas para seguir el modelo de componentes durante la ejecución.
 * @details Agregado para el trabajo práctico "Modelo de Componentes (aplicación práctica)".
 * Sin la definición SEGUIMIENTO (-DSEGUIMIENTO) los macros no hacen nada y el código
 * se comporta exactamente como el original. Con la variable de entorno
 * SEGUIMIENTO_SILENCIO definida, las trazas se apagan en tiempo de ejecución.
 */

#ifndef SEGUIMIENTO_HPP
#define SEGUIMIENTO_HPP

#ifdef SEGUIMIENTO
    #include <cstdio>
    #include <cstdlib>

    inline bool traza_activa()
    {
        return std::getenv("SEGUIMIENTO_SILENCIO") == nullptr;
    }

    // TRAZA_HOST: lo que ocurre del lado del Host (infraestructura y aplicación).
    #define TRAZA_HOST(...) do { if (traza_activa()) { std::printf("    [host]       " __VA_ARGS__); std::printf("\n"); std::fflush(stdout); } } while (0)

    // TRAZA_COMP: lo que ocurre dentro del componente (la biblioteca dinámica).
    #define TRAZA_COMP(...) do { if (traza_activa()) { std::printf("    [componente] " __VA_ARGS__); std::printf("\n"); std::fflush(stdout); } } while (0)
#else
    #define TRAZA_HOST(...) do {} while (0)
    #define TRAZA_COMP(...) do {} while (0)
#endif

#endif // SEGUIMIENTO_HPP
