import type { IArma } from "./i_arma.js";

/**
 * Arma concreta. Se crea afuera del Personaje y se le entrega (agregación):
 * la misma instancia puede ser usada por varios personajes a la vez.
 */
export class Arma implements IArma
{
    constructor(
        private readonly nombre: string,
        private readonly danio: number,
        private readonly icono: string,
        private readonly color: string
    ) {}

    getNombre(): string { return this.nombre; }
    getDanio(): number { return this.danio; }
    getIcono(): string { return this.icono; }
    getColor(): string { return this.color; }
}
