/**
 * Componente de prueba (DEMUESTRA EL ERROR): las tres funciones de la C-API están
 * definidas SIN extern "C". El compilador de C++ les decora el nombre
 * (name mangling), así que dlsym / GetProcAddress no encuentran "create_component".
 * Sirve para ver por qué extern "C" es parte de la frontera del ABI.
 */
#include "../../include/i_greeter.hpp"

class GreeterSinExternC : public IGreeter
{
    public:
        ComponentResult greet(const char*, char*, size_t) noexcept override { return ComponentResult::SUCCESS; }
};

int get_api_version() noexcept { return CURRENT_API_VERSION; }

IComponent* create_component() noexcept
{
    try { return new GreeterSinExternC(); } catch (...) { return nullptr; }
}

void destroy_component(IComponent* instance) noexcept { delete instance; }
