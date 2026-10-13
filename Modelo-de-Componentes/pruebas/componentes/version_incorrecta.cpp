/**
 * Componente de prueba: exporta los tres símbolos C, pero declara una versión de ABI
 * distinta de la del Host (99 en lugar de CURRENT_API_VERSION).
 * Sirve para ver cómo el ModuleManager rechaza el módulo ANTES de crear nada.
 */
#include "../../include/i_greeter.hpp"

class GreeterViejo : public IGreeter
{
    public:
        ComponentResult greet(const char*, char*, size_t) noexcept override { return ComponentResult::SUCCESS; }
};

extern "C" int get_api_version() noexcept { return 99; }

extern "C" IComponent* create_component() noexcept
{
    try { return new GreeterViejo(); } catch (...) { return nullptr; }
}

extern "C" void destroy_component(IComponent* instance) noexcept { delete instance; }
