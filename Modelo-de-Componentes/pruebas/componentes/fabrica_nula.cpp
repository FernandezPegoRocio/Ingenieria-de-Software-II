/**
 * Componente de prueba: la fábrica falla y devuelve nullptr (como haría
 * create_component si new lanzara std::bad_alloc y el catch lo atrapara).
 * Sirve para ver el error "La fábrica de la biblioteca devolvió una instancia nula".
 */
#include "../../include/i_component.hpp"

extern "C" int get_api_version() noexcept { return CURRENT_API_VERSION; }

extern "C" IComponent* create_component() noexcept { return nullptr; }

extern "C" void destroy_component(IComponent* instance) noexcept { delete instance; }
