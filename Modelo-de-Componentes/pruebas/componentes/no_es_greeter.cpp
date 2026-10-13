/**
 * Componente de prueba: cumple la C-API y la versión, pero el objeto que crea es
 * un IComponent genérico que NO implementa IGreeter.
 * Sirve para ver el dynamic_cast fallido y la limpieza con destroy_component.
 */
#include "../../include/i_component.hpp"
#include "../../include/seguimiento.hpp"

class ComponenteGenerico : public IComponent
{
    public:
        ComponenteGenerico() { TRAZA_COMP("ComponenteGenerico construido"); }
        ~ComponenteGenerico() noexcept override { TRAZA_COMP("ComponenteGenerico destruido"); }
};

extern "C" int get_api_version() noexcept { return CURRENT_API_VERSION; }

extern "C" IComponent* create_component() noexcept
{
    try { return new ComponenteGenerico(); } catch (...) { return nullptr; }
}

extern "C" void destroy_component(IComponent* instance) noexcept { delete instance; }
