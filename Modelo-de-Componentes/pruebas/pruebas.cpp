/**
 * @file pruebas.cpp
 * @brief Seguimiento práctico del modelo de componentes: recorre los puntos 1 a 4
 * de la consigna ejecutando el código real y verificando cada afirmación.
 * @details El punto 5 (rechazo a std::exit) está en pruebas/exit_vs_excepcion.cpp.
 * Cada línea [OK] / [FALLA] es una verificación automática.
 *
 * Compilar con -DSEGUIMIENTO (ver compilar_linux.sh y compilar_windows.bat).
 */

#include "../include/module_manager.hpp"
#include "../include/i_greeter.hpp"
#include <atomic>
#include <cstdlib>
#include <functional>
#include <iostream>
#include <string>
#include <thread>
#include <type_traits>
#include <vector>

#ifndef SEGUIMIENTO
    #error "Compilar con -DSEGUIMIENTO (se usan las trazas y ModuleManager::references_of)"
#endif

// ---------------------------------------------------------------------------
// PUNTO 1, verificado por el compilador: la frontera del ABI usa tipos de C y noexcept.
// Si alguien quita un noexcept o cambia un tipo, este archivo deja de compilar.
// ---------------------------------------------------------------------------
static_assert(std::is_same<get_api_version_func, int (*)() noexcept>::value,
              "get_api_version debe ser int(*)() noexcept");
static_assert(std::is_same<create_component_func, IComponent* (*)() noexcept>::value,
              "create_component debe ser IComponent*(*)() noexcept");
static_assert(std::is_same<destroy_component_func, void (*)(IComponent*) noexcept>::value,
              "destroy_component debe ser void(*)(IComponent*) noexcept");
static_assert(std::is_nothrow_destructible<IComponent>::value,
              "el destructor de IComponent debe ser noexcept");
static_assert(std::is_same<decltype(&IGreeter::greet),
                           ComponentResult (IGreeter::*)(const char*, char*, size_t) noexcept>::value,
              "greet debe usar solo const char*, char*, size_t y ser noexcept");

// ---------------------------------------------------------------------------
// Utilidades de la prueba
// ---------------------------------------------------------------------------
static int total_verificaciones = 0;
static int verificaciones_fallidas = 0;

static void verificar(bool condicion, const std::string& descripcion)
{
    ++total_verificaciones;
    if (!condicion) ++verificaciones_fallidas;
    std::cout << "  " << (condicion ? "[OK]    " : "[FALLA] ") << descripcion << std::endl;
}

static void titulo(const std::string& texto)
{
    std::cout << "\n=== " << texto << " ===" << std::endl;
}

static bool contiene(const std::string& texto, const std::string& parte)
{
    return texto.find(parte) != std::string::npos;
}

// Ejecuta una acción y devuelve el mensaje de la std::exception que lance ("" si no lanza).
static std::string mensaje_de_error(const std::function<void()>& accion)
{
    try { accion(); }
    catch (const std::exception& e) { return e.what(); }
    return "";
}

// ¿La biblioteca sigue cargada en el proceso? (independiente del ModuleManager)
static bool esta_cargada(const std::string& nombre)
{
    #ifdef _WIN32
        return GetModuleHandleA((nombre + LIB_EXTENSION).c_str()) != nullptr;
    #else
        std::string ruta = "./lib/" + nombre + LIB_EXTENSION;
        void* handle = dlopen(ruta.c_str(), RTLD_NOW | RTLD_NOLOAD);
        if (handle) { dlclose(handle); return true; }
        return false;
    #endif
}

static void silenciar_trazas(bool silenciar)
{
    #ifdef _WIN32
        _putenv_s("SEGUIMIENTO_SILENCIO", silenciar ? "1" : "");
    #else
        if (silenciar) setenv("SEGUIMIENTO_SILENCIO", "1", 1);
        else unsetenv("SEGUIMIENTO_SILENCIO");
    #endif
}

// ---------------------------------------------------------------------------
// PUNTO 1: Frontera del ABI segura (C-API y noexcept)
// ---------------------------------------------------------------------------
static void punto_1_frontera_abi()
{
    titulo("PUNTO 1: Frontera del ABI segura (C-API y noexcept)");
    std::cout << "  (Los tipos de la C-API y de IGreeter::greet son noexcept y de tipos C: lo verificó el compilador con static_assert)" << std::endl;

    ModuleManager gestor;

    gestor.load_module("./lib/greeter");
    auto saludador = gestor.create_instance<IGreeter>("greeter");
    verificar(saludador != nullptr, "greeter: usa extern \"C\" y la versión de ABI coincide -> el componente se crea");

    gestor.load_module("./lib/version_incorrecta");
    std::string error = mensaje_de_error([&] { gestor.create_instance<IGreeter>("version_incorrecta"); });
    std::cout << "    mensaje del Host: " << error << std::endl;
    verificar(contiene(error, "Discrepancia de ABI") && contiene(error, "Esperado: 1, Encontrado: 99"),
              "version_incorrecta: el Host la rechaza antes de crear ningún objeto");

    gestor.load_module("./lib/sin_simbolos");
    error = mensaje_de_error([&] { gestor.create_instance<IGreeter>("sin_simbolos"); });
    std::cout << "    mensaje del Host: " << error << std::endl;
    verificar(contiene(error, "Faltan símbolos requeridos"),
              "sin_simbolos: no exporta la C-API -> el Host lo detecta");

    gestor.load_module("./lib/sin_extern_c");
    error = mensaje_de_error([&] { gestor.create_instance<IGreeter>("sin_extern_c"); });
    std::cout << "    mensaje del Host: " << error << std::endl;
    verificar(contiene(error, "Faltan símbolos requeridos"),
              "sin_extern_c: las mismas funciones SIN extern \"C\" quedan con el nombre decorado y no se encuentran");

    error = mensaje_de_error([&] { gestor.load_module("./lib/no_existe"); });
    std::cout << "    mensaje del Host: " << error << std::endl;
    verificar(contiene(error, "Error Crítico al cargar no_existe"),
              "no_existe: la falla al cargar sube como std::runtime_error, no como código ni exit()");
}

// ---------------------------------------------------------------------------
// PUNTO 2: Eliminación de excepciones cruzadas y tipos C++ estándar
// ---------------------------------------------------------------------------
static void punto_2_sin_excepciones_cruzadas()
{
    titulo("PUNTO 2: Eliminación de excepciones cruzadas y tipos C++ estándar");

    ModuleManager gestor;
    gestor.load_module("./lib/greeter");
    auto saludador = gestor.create_instance<IGreeter>("greeter");

    char salida[256];
    ComponentResult resultado = saludador->greet("Rocio", salida, sizeof(salida));
    verificar(resultado == ComponentResult::SUCCESS && std::string(salida) == "Hello, Rocio!",
              "greet con buffer de C (char*, size_t) -> SUCCESS y el texto llega por el buffer: \"" + std::string(salida) + "\"");

    char chico[5];
    resultado = saludador->greet("Rocio", chico, sizeof(chico));
    verificar(resultado == ComponentResult::ERROR_INVALID_ARGUMENT,
              "buffer de 5 bytes -> ERROR_INVALID_ARGUMENT (no desborda el buffer)");

    resultado = saludador->greet(nullptr, salida, sizeof(salida));
    verificar(resultado == ComponentResult::ERROR_INVALID_ARGUMENT, "nombre nulo -> ERROR_INVALID_ARGUMENT");

    resultado = saludador->greet("Rocio", salida, 0);
    verificar(resultado == ComponentResult::ERROR_INVALID_ARGUMENT, "buffer de tamaño 0 -> ERROR_INVALID_ARGUMENT");

    gestor.load_module("./lib/fallo_interno");
    auto que_falla = gestor.create_instance<IGreeter>("fallo_interno");
    bool llego_excepcion_al_host = false;
    ComponentResult resultado_interno = ComponentResult::SUCCESS;
    try { resultado_interno = que_falla->greet("Rocio", salida, sizeof(salida)); }
    catch (...) { llego_excepcion_al_host = true; }
    verificar(!llego_excepcion_al_host && resultado_interno == ComponentResult::ERROR_INTERNAL,
              "fallo_interno: una std::runtime_error ocurrió ADENTRO del componente; al Host solo le llegó ERROR_INTERNAL");
}

// ---------------------------------------------------------------------------
// PUNTO 3: Gestión automática de memoria cruzada (RAII con custom deleters)
// ---------------------------------------------------------------------------
static void punto_3_memoria_cruzada()
{
    titulo("PUNTO 3: Gestión automática de memoria cruzada (RAII con custom deleters)");

    std::cout << "  -- Caso A: el ModuleManager vive más que los componentes --" << std::endl;
    {
        ModuleManager gestor;
        gestor.load_module("./lib/greeter");
        verificar(gestor.references_of("greeter") == 1, "después de load_module: 1 referencia a la biblioteca (la del mapa)");

        auto g1 = gestor.create_instance<IGreeter>("greeter");
        verificar(gestor.references_of("greeter") == 2, "con 1 componente vivo: 2 referencias (mapa + deleter del componente)");

        auto g2 = gestor.create_instance<IGreeter>("greeter");
        verificar(gestor.references_of("greeter") == 3, "con 2 componentes vivos: 3 referencias");

        g1.reset();
        verificar(gestor.references_of("greeter") == 2, "se destruye el 1.º componente: vuelve a 2 referencias");

        g2.reset();
        verificar(gestor.references_of("greeter") == 1, "se destruye el 2.º componente: queda 1 referencia (el mapa)");
        verificar(esta_cargada("greeter"), "la biblioteca sigue cargada porque el mapa la conserva");
    }
    verificar(!esta_cargada("greeter"), "al destruirse el ModuleManager, sin componentes vivos, la biblioteca se descarga");

    std::cout << "  -- Caso B: el ModuleManager muere ANTES que los componentes --" << std::endl;
    std::shared_ptr<IGreeter> g1, g2;
    {
        ModuleManager gestor;
        gestor.load_module("./lib/greeter");
        g1 = gestor.create_instance<IGreeter>("greeter");
        g2 = gestor.create_instance<IGreeter>("greeter");
    }
    verificar(esta_cargada("greeter"), "el ModuleManager ya no existe, pero la biblioteca sigue cargada (la retienen los deleters)");

    char salida[64];
    ComponentResult resultado = g1->greet("Rocio", salida, sizeof(salida));
    verificar(resultado == ComponentResult::SUCCESS, "y el código del componente sigue siendo ejecutable: greet -> \"" + std::string(salida) + "\"");

    g1.reset();
    verificar(esta_cargada("greeter"), "se destruye el 1.º componente: sigue cargada (queda el 2.º)");

    g2.reset();
    verificar(!esta_cargada("greeter"), "se destruye el último componente: recién ahí se descarga la biblioteca");
}

// ---------------------------------------------------------------------------
// PUNTO 4: Seguridad de hilos y concurrencia primitiva
// ---------------------------------------------------------------------------
static void punto_4_hilos()
{
    titulo("PUNTO 4: Seguridad de hilos y concurrencia primitiva");

    const int HILOS = 8;
    const int ITERACIONES = 25;
    std::cout << "  " << HILOS << " hilos x " << ITERACIONES << " iteraciones: cada una hace load_module + create_instance + greet sobre el MISMO ModuleManager" << std::endl;
    std::cout << "  (trazas apagadas durante esta prueba para no mezclar la salida de los hilos)" << std::endl;

    silenciar_trazas(true);

    ModuleManager gestor;
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
                catch (...) { /* una excepción del Host contaría como falla */ }
            }
        });
    }
    for (auto& hilo : hilos) hilo.join();

    long referencias = gestor.references_of("greeter");
    silenciar_trazas(false);

    verificar(exitosas == HILOS * ITERACIONES,
              std::to_string(exitosas.load()) + " de " + std::to_string(HILOS * ITERACIONES) + " operaciones concurrentes terminaron bien");
    verificar(referencias == 1,
              "al terminar los hilos, la biblioteca tiene 1 referencia (solo el mapa): ningún componente quedó sin destruir");
}

int main()
{
    std::cout << "Seguimiento práctico del modelo de componentes" << std::endl;

    punto_1_frontera_abi();
    punto_2_sin_excepciones_cruzadas();
    punto_3_memoria_cruzada();
    punto_4_hilos();

    std::cout << "\n=== RESUMEN ===" << std::endl;
    std::cout << "  Verificaciones: " << total_verificaciones << ", fallidas: " << verificaciones_fallidas << std::endl;
    return verificaciones_fallidas == 0 ? EXIT_SUCCESS : EXIT_FAILURE;
}
