/**
 * Contrato de cualquier arma. El Personaje solo conoce esta interfaz,
 * nunca una arma concreta (inversión de dependencias).
 */
export interface IArma
{
    getNombre(): string;
    getDanio(): number;
    getIcono(): string;
    getColor(): string;
}
