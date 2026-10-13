/**
 * Componente de prueba: es una biblioteca válida, pero NO exporta la C-API
 * (get_api_version, create_component, destroy_component).
 * Sirve para ver el error "Faltan símbolos requeridos".
 */
extern "C" int funcion_cualquiera() noexcept { return 42; }
