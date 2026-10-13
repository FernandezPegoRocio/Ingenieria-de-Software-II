/**
 * @file exit_vs_excepcion.cpp
 * @brief PUNTO 5: por qué la infraestructura propaga excepciones en lugar de llamar a std::exit.
 * @details Simula una falla de infraestructura (como una biblioteca que no se puede cargar) con
 * dos estrategias y muestra qué pasa con un recurso RAII que está vivo en ese momento.
 *
 * Uso:  exit_vs_excepcion exit        -> la infraestructura llama a std::exit(EXIT_FAILURE)
 *       exit_vs_excepcion excepcion   -> la infraestructura lanza std::runtime_error (como ModuleManager)
 */

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <stdexcept>

// Un recurso RAII cualquiera (un archivo, un socket, un mutex...). Avisa cuándo se libera.
struct Recurso
{
    const char* nombre;
    explicit Recurso(const char* n) : nombre(n) { std::printf("    [RAII] se adquiere: %s\n", nombre); std::fflush(stdout); }
    ~Recurso()                                  { std::printf("    [RAII] se libera:   %s\n", nombre); std::fflush(stdout); }
};

static void infraestructura_con_exit()
{
    std::printf("  infraestructura: falla -> llamo a std::exit(EXIT_FAILURE)\n");
    std::fflush(stdout);
    std::exit(EXIT_FAILURE);
}

static void infraestructura_con_excepcion()
{
    std::printf("  infraestructura: falla -> lanzo std::runtime_error\n");
    std::fflush(stdout);
    throw std::runtime_error("ModuleManager Error Crítico al cargar greeter");
}

// Hace el papel de Application::run(): tiene un recurso vivo cuando la infraestructura falla.
static void aplicacion(bool usar_exit)
{
    Recurso recurso_local("recurso de la aplicación (variable local)");
    if (usar_exit) infraestructura_con_exit();
    else           infraestructura_con_excepcion();
}

int main(int argc, char** argv)
{
    const bool usar_exit = (argc > 1 && std::strcmp(argv[1], "exit") == 0);
    std::printf("Estrategia: %s\n", usar_exit ? "std::exit" : "excepción");

    try
    {
        aplicacion(usar_exit);
    }
    catch (const std::exception& e)
    {
        // Es lo que hace main.cpp: captura el error de infraestructura y termina de forma ordenada.
        std::printf("  main: capturé la excepción -> %s\n", e.what());
        std::printf("  main: termino con EXIT_FAILURE de forma ordenada\n");
        return EXIT_FAILURE;
    }
    return EXIT_SUCCESS;
}
