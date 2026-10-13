/**
 * Lo que una habilidad puede hacerle a su dueño.
 * Personaje implementa esta interfaz; así la habilidad no depende de la clase Personaje.
 */
export interface IObjetivoDeHabilidad
{
    curar(puntos: number): number;
    proteger(puntos: number): void;
    encolerizar(): void;
}

/**
 * Contrato de cualquier habilidad.
 */
export interface IHabilidad
{
    getNombre(): string;
    getPoder(): number;
    getIcono(): string;
    getColor(): string;

    /** Aplica el efecto sobre el objetivo y devuelve un texto que lo describe. */
    usar(objetivo: IObjetivoDeHabilidad): string;
}
