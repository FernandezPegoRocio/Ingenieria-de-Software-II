import type { IArma } from "./i_arma.js";
import type { IHabilidad, IObjetivoDeHabilidad } from "./i_habilidad.js";

/**
 * Personaje: AGREGA un arma y una habilidad que recibe desde afuera
 * ("tiene un" arma, "tiene una" habilidad). Como solo conoce las interfaces,
 * puede cambiarlas en tiempo de ejecución sin destruirse ni crear subclases.
 */
export class Personaje implements IObjetivoDeHabilidad
{
    private vida: number;
    private escudo: number = 0;
    private furioso: boolean = false;

    constructor(
        private readonly nombre: string,
        private readonly vidaMaxima: number,
        private arma: IArma,
        private habilidad: IHabilidad
    )
    {
        this.vida = vidaMaxima;
    }

    // ---------- Consultas ----------

    getNombre(): string { return this.nombre; }
    getVida(): number { return this.vida; }
    getVidaMaxima(): number { return this.vidaMaxima; }
    getEscudo(): number { return this.escudo; }
    estaFurioso(): boolean { return this.furioso; }
    estaVivo(): boolean { return this.vida > 0; }
    getArma(): IArma { return this.arma; }
    getHabilidad(): IHabilidad { return this.habilidad; }

    // ---------- Acciones ----------

    atacar(rival: Personaje): string
    {
        if (!this.estaVivo()) return `${this.nombre} está derrotado y no puede atacar.`;
        if (!rival.estaVivo()) return `${rival.getNombre()} ya está derrotado.`;

        const multiplicador = this.furioso ? 2 : 1;
        this.furioso = false;

        const danio = this.arma.getDanio() * multiplicador;
        const resultado = rival.recibirDanio(danio);
        return `${this.nombre} ataca con ${this.arma.getNombre()} (${danio} de daño). ${resultado}`;
    }

    usarHabilidad(): string
    {
        if (!this.estaVivo()) return `${this.nombre} está derrotado y no puede usar habilidades.`;
        return `${this.nombre} usa ${this.habilidad.getNombre()}: ${this.habilidad.usar(this)}.`;
    }

    cambiarArma(nuevaArma: IArma): string
    {
        this.arma = nuevaArma;
        return `${this.nombre} ahora utiliza ${nuevaArma.getNombre()}.`;
    }

    cambiarHabilidad(nuevaHabilidad: IHabilidad): string
    {
        this.habilidad = nuevaHabilidad;
        return `${this.nombre} ahora domina ${nuevaHabilidad.getNombre()}.`;
    }

    recibirDanio(danio: number): string
    {
        if (!this.estaVivo()) return `${this.nombre} ya está derrotado.`;

        const absorbido = Math.min(this.escudo, danio);
        this.escudo -= absorbido;
        const restante = danio - absorbido;
        this.vida = Math.max(0, this.vida - restante);

        let mensaje = `${this.nombre} recibe ${restante} de daño`;
        if (absorbido > 0) mensaje += ` (el escudo absorbió ${absorbido})`;
        mensaje += `. Vida: ${this.vida}/${this.vidaMaxima}.`;
        if (!this.estaVivo()) mensaje += " ¡Derrotado!";
        return mensaje;
    }

    reiniciar(): void
    {
        this.vida = this.vidaMaxima;
        this.escudo = 0;
        this.furioso = false;
    }

    // ---------- IObjetivoDeHabilidad (lo que las habilidades pueden pedirle) ----------

    curar(puntos: number): number
    {
        const antes = this.vida;
        this.vida = Math.min(this.vidaMaxima, this.vida + puntos);
        return this.vida - antes;
    }

    proteger(puntos: number): void { this.escudo += puntos; }

    encolerizar(): void { this.furioso = true; }
}
