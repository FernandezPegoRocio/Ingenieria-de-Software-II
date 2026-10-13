import type { IHabilidad, IObjetivoDeHabilidad } from "./i_habilidad.js";

/** Recupera vida. */
export class Curacion implements IHabilidad
{
    constructor(private readonly poder: number = 25) {}

    getNombre(): string { return "Curación"; }
    getPoder(): number { return this.poder; }
    getIcono(): string { return "💚"; }
    getColor(): string { return "#4ade80"; }

    usar(objetivo: IObjetivoDeHabilidad): string
    {
        const recuperado = objetivo.curar(this.poder);
        return `recupera ${recuperado} de vida`;
    }
}

/** Agrega puntos de escudo que absorben daño antes que la vida. */
export class EscudoMagico implements IHabilidad
{
    constructor(private readonly poder: number = 15) {}

    getNombre(): string { return "Escudo mágico"; }
    getPoder(): number { return this.poder; }
    getIcono(): string { return "🛡️"; }
    getColor(): string { return "#60a5fa"; }

    usar(objetivo: IObjetivoDeHabilidad): string
    {
        objetivo.proteger(this.poder);
        return `gana ${this.poder} puntos de escudo`;
    }
}

/** El próximo ataque hace el doble de daño. */
export class Furia implements IHabilidad
{
    getNombre(): string { return "Furia"; }
    getPoder(): number { return 2; }
    getIcono(): string { return "🔥"; }
    getColor(): string { return "#f87171"; }

    usar(objetivo: IObjetivoDeHabilidad): string
    {
        objetivo.encolerizar();
        return "su próximo ataque hará el doble de daño";
    }
}
