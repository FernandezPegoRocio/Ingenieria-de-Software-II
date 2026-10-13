/**
 * Componente de prueba: dentro de greet() ocurre una excepción C++ real
 * (std::runtime_error), pero el bloque try-catch(...) del componente la atrapa
 * y la convierte en ComponentResult::ERROR_INTERNAL, igual que hace GreeterComponent.
 * Sirve para ver que la excepción NUNCA llega al Host.
 */
#include "../../include/i_greeter.hpp"
#include "../../include/seguimiento.hpp"
#include <stdexcept>

class GreeterQueFalla : public IGreeter
{
    public:
        ComponentResult greet(const char*, char*, size_t) noexcept override
        {
            try
            {
                TRAZA_COMP("greet(): lanzo std::runtime_error dentro del componente");
                throw std::runtime_error("fallo simulado dentro del componente");
            }
            catch (...)
            {
                TRAZA_COMP("greet(): el catch(...) atrapó la excepción; devuelvo un código de error");
                return ComponentResult::ERROR_INTERNAL;
            }
        }
};

extern "C" int get_api_version() noexcept { return CURRENT_API_VERSION; }

extern "C" IComponent* create_component() noexcept
{
    try { return new GreeterQueFalla(); } catch (...) { return nullptr; }
}

extern "C" void destroy_component(IComponent* instance) noexcept { delete instance; }
