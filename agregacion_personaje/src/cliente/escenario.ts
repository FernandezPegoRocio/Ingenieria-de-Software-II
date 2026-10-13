import type { Personaje } from "../modelo/personaje.js";

/** Un personaje del modelo + lo que hace falta para dibujarlo. */
export interface Actor
{
    personaje: Personaje;
    color: string;
    x: number;
    lado: 1 | -1;   // 1 mira a la derecha, -1 mira a la izquierda
}

type TipoEfecto = "embestida" | "habilidad" | "golpe";

interface Efecto
{
    tipo: TipoEfecto;
    actor: number;
    inicio: number;
    duracion: number;
    texto?: string;
    color?: string;
}

const SUELO_Y = 270;

/**
 * Dibuja el escenario en un <canvas> de HTML5.
 * Solo LEE el estado de los Personaje; no modifica el modelo.
 */
export class Escenario
{
    private readonly ctx: CanvasRenderingContext2D;
    private efectos: Efecto[] = [];

    constructor(private readonly lienzo: HTMLCanvasElement, private readonly actores: Actor[])
    {
        const contexto = lienzo.getContext("2d");
        if (contexto === null) throw new Error("Este navegador no soporta canvas 2D");
        this.ctx = contexto;
    }

    iniciar(): void
    {
        const bucle = (): void =>
        {
            this.dibujar(performance.now());
            requestAnimationFrame(bucle);
        };
        requestAnimationFrame(bucle);
    }

    // ---------- Efectos que dispara la interfaz ----------

    embestida(actor: number): void
    {
        this.efectos.push({ tipo: "embestida", actor, inicio: performance.now(), duracion: 500 });
    }

    habilidad(actor: number, icono: string, color: string): void
    {
        this.efectos.push({ tipo: "habilidad", actor, inicio: performance.now(), duracion: 900, texto: icono, color });
    }

    golpe(actor: number): void
    {
        this.efectos.push({ tipo: "golpe", actor, inicio: performance.now(), duracion: 400 });
    }

    // ---------- Dibujo ----------

    private progreso(efecto: Efecto, ahora: number): number
    {
        return (ahora - efecto.inicio) / efecto.duracion;
    }

    private dibujar(ahora: number): void
    {
        const ctx = this.ctx;
        const ancho = this.lienzo.width;
        const alto = this.lienzo.height;

        this.efectos = this.efectos.filter((e) => this.progreso(e, ahora) < 1);

        // Fondo
        const cielo = ctx.createLinearGradient(0, 0, 0, SUELO_Y);
        cielo.addColorStop(0, "#1e1b4b");
        cielo.addColorStop(1, "#4c3a7a");
        ctx.fillStyle = cielo;
        ctx.fillRect(0, 0, ancho, alto);
        ctx.fillStyle = "#2d3a2e";
        ctx.fillRect(0, SUELO_Y, ancho, alto - SUELO_Y);

        this.actores.forEach((actor, indice) => this.dibujarActor(actor, indice, ahora));
    }

    private dibujarActor(actor: Actor, indice: number, ahora: number): void
    {
        const ctx = this.ctx;
        const p = actor.personaje;
        const mios = this.efectos.filter((e) => e.actor === indice);

        let dx = 0;
        let giroArma = 0;
        let destello = 0;

        for (const e of mios)
        {
            const t = this.progreso(e, ahora);
            if (e.tipo === "embestida")
            {
                dx += Math.sin(Math.PI * t) * 90 * actor.lado;
                giroArma = Math.sin(Math.PI * t) * 1.3 * actor.lado;
            }
            if (e.tipo === "golpe")
            {
                dx += Math.sin(t * 28) * 6 * (1 - t);
                destello = 1 - t;
            }
        }

        const x = actor.x + dx;
        const vivo = p.estaVivo();

        // Sombra
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.beginPath();
        ctx.ellipse(x, SUELO_Y + 4, 48, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        if (!vivo)
        {
            ctx.translate(x, SUELO_Y);
            ctx.rotate(actor.lado * -Math.PI / 2.3);
            ctx.translate(-x, -SUELO_Y);
            ctx.globalAlpha = 0.55;
        }

        // Aura de furia
        if (p.estaFurioso())
        {
            ctx.shadowColor = "#ef4444";
            ctx.shadowBlur = 28;
        }

        // Cuerpo y cabeza
        ctx.fillStyle = vivo ? actor.color : "#6b7280";
        ctx.beginPath();
        ctx.roundRect(x - 30, SUELO_Y - 120, 60, 112, 14);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, SUELO_Y - 142, 25, 0, Math.PI * 2);
        ctx.fillStyle = "#f4d4b0";
        ctx.fill();
        ctx.shadowBlur = 0;

        // Ojos
        ctx.fillStyle = "#1f2937";
        ctx.beginPath();
        ctx.arc(x + actor.lado * 9, SUELO_Y - 146, 3.5, 0, Math.PI * 2);
        ctx.arc(x + actor.lado * 1, SUELO_Y - 146, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Destello rojo al recibir un golpe
        if (destello > 0)
        {
            ctx.fillStyle = `rgba(239,68,68,${0.6 * destello})`;
            ctx.beginPath();
            ctx.roundRect(x - 30, SUELO_Y - 120, 60, 112, 14);
            ctx.fill();
        }

        // Arma en la mano (dibujada con lo que informa la interfaz IArma)
        ctx.save();
        ctx.translate(x + actor.lado * 40, SUELO_Y - 80);
        ctx.rotate(giroArma);
        ctx.font = "46px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.scale(actor.lado, 1);
        ctx.fillText(p.getArma().getIcono(), 0, 0);
        ctx.restore();

        ctx.restore();

        // Escudo
        if (p.getEscudo() > 0 && vivo)
        {
            ctx.strokeStyle = "rgba(96,165,250,0.75)";
            ctx.fillStyle = "rgba(96,165,250,0.12)";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(x, SUELO_Y - 84, 92, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // Efecto de habilidad
        for (const e of mios)
        {
            if (e.tipo !== "habilidad") continue;
            const t = this.progreso(e, ahora);
            ctx.save();
            ctx.globalAlpha = 1 - t;
            ctx.strokeStyle = e.color ?? "#fff";
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(actor.x, SUELO_Y - 84, 30 + t * 85, 0, Math.PI * 2);
            ctx.stroke();
            ctx.font = "44px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(e.texto ?? "", actor.x, SUELO_Y - 185 - t * 18);
            ctx.restore();
        }

        this.dibujarBarra(actor);
    }

    private dibujarBarra(actor: Actor): void
    {
        const ctx = this.ctx;
        const p = actor.personaje;
        const ancho = 180;
        const x = actor.x - ancho / 2;
        const y = 54;
        const proporcion = p.getVida() / p.getVidaMaxima();

        ctx.textAlign = "center";
        ctx.fillStyle = "#f3f4f6";
        ctx.font = "bold 18px system-ui, sans-serif";
        ctx.fillText(p.getNombre(), actor.x, 30);

        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(x, y, ancho, 16);
        ctx.fillStyle = proporcion > 0.5 ? "#22c55e" : proporcion > 0.25 ? "#eab308" : "#ef4444";
        ctx.fillRect(x, y, ancho * proporcion, 16);
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, ancho, 16);

        ctx.fillStyle = "#e5e7eb";
        ctx.font = "13px system-ui, sans-serif";
        let texto = `Vida ${p.getVida()}/${p.getVidaMaxima()}`;
        if (p.getEscudo() > 0) texto += `  ·  🛡️ ${p.getEscudo()}`;
        if (p.estaFurioso()) texto += "  ·  🔥";
        ctx.fillText(texto, actor.x, y + 34);
    }
}
