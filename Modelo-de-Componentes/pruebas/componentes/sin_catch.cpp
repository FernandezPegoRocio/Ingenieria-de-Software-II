/**
 * Componente de prueba (DEMUESTRA EL ERROR, no es un ejemplo a imitar):
 * greet() está marcado noexcept pero deja escapar una excepción porque NO tiene
 * try-catch. Por ser noexcept, el compilador llama a std::terminate() en lugar de
 * dejar que la excepción cruce la frontera del módulo.
 * Se usa solo desde pruebas/prueba_terminate.cpp porque aborta el programa.
 */
#include "../../include/i_greeter.hpp"
#include <stdexcept>

class GreeterSinCatch : public IGreeter
{
    public:
        ComponentResult greet(const char*, char*, size_t) noexcept override
        {
            throw std::runtime_error("excepción que intenta escapar del componente");
        }
};

extern "C" int get_api_version() noexcept { return CURRENT_API_VERSION; }

extern "C" IComponent* create_component() noexcept
{
    try { return new GreeterSinCatch(); } catch (...) { return nullptr; }
}

extern "C" void destroy_component(IComponent* instance) noexcept { delete instance; }
