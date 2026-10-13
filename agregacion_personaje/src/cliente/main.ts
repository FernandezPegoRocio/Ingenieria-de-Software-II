import { Arma } from "../modelo/arma.js";
import { Curacion, EscudoMagico, Furia } from "../modelo/habilidades.js";
import { Personaje } from "../modelo/personaje.js";
import type { IArma } from "../modelo/i_arma.js";
import type { IHabilidad } from "../modelo/i_habilidad.js";
import { Escenario } from "./escenario.js";
import type { Actor } from "./escenario.js";

// ============================================
// CATÁLOGOS: objetos creados afuera de los personajes
// ============================================

const catalogoArmas: IArma[] = [
    new Arma("Espada de fuego", 30, "🗡️", "#fb923c"),
    new Arma("Arco mágico", 20, "🏹", "#6ee7b7"),
    new Arma("Hacha de hielo", 25, "🪓", "#7dd3fc")
];

const catalogoHabilidades: IHabilidad[] = [
    new Curacion(25),
    new EscudoMagico(15),
    new Furia()
];

// ============================================
// PERSONAJES (agregación: reciben su arma y su habilidad)
// ============================================

const guerrero = new Personaje("Guerrero", 100, catalogoArmas[0], catalogoHabilidades[0]);
const arquero = new Personaje("Arquero", 80, catalogoArmas[1], catalogoHabilidades[1]);

const actores: Actor[] = [
    { personaje: guerrero, color: "#c2410c", x: 210, lado: 1 },
    { personaje: arquero, color: "#0f766e", x: 590, lado: -1 }
];

// ============================================
// INTERFAZ
// ============================================

const lienzo = document.getElementById("lienzo") as HTMLCanvasElement;
const contenedor = document.getElementById("paneles") as HTMLElement;
const registro = document.getElementById("registro") as HTMLUListElement;
const aviso = document.getElementById("aviso") as HTMLElement;
const escenario = new Escenario(lienzo, actores);

function anotar(mensaje: string): void
{
    const item = document.createElement("li");
    item.textContent = mensaje;
    registro.prepend(item);
    while (registro.children.length > 40) registro.lastElementChild?.remove();
}

function actualizarAviso(): void
{
    const mismaArma = guerrero.getArma() === arquero.getArma();
    const mismaHabilidad = guerrero.getHabilidad() === arquero.getHabilidad();
    const partes: string[] = [];
    if (mismaArma) partes.push(`ambos usan el mismo objeto Arma (${guerrero.getArma().getNombre()})`);
    if (mismaHabilidad) partes.push(`ambos usan el mismo objeto Habilidad (${guerrero.getHabilidad().getNombre()})`);
    aviso.textContent = partes.length > 0
        ? `🔗 Agregación: ${partes.join(" y ")}. Es una sola instancia compartida.`
        : "Cada personaje tiene su propia arma y su propia habilidad.";
}

function crearBoton(texto: string, alHacerClic: () => void): HTMLButtonElement
{
    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = texto;
    boton.addEventListener("click", alHacerClic);
    return boton;
}

function crearSelector<T extends { getNombre(): string; getIcono(): string }>(
    titulo: string,
    opciones: T[],
    actual: T,
    alCambiar: (elegida: T) => void
): HTMLLabelElement
{
    const etiqueta = document.createElement("label");
    etiqueta.textContent = titulo;
    const selector = document.createElement("select");
    opciones.forEach((opcion, i) =>
    {
        const o = document.createElement("option");
        o.value = String(i);
        o.textContent = `${opcion.getIcono()} ${opcion.getNombre()}`;
        o.selected = opcion === actual;
        selector.appendChild(o);
    });
    selector.addEventListener("change", () => alCambiar(opciones[Number(selector.value)]));
    etiqueta.appendChild(selector);
    return etiqueta;
}

function construirPanel(indice: number): HTMLElement
{
    const actor = actores[indice];
    const rivalIndice = indice === 0 ? 1 : 0;
    const p = actor.personaje;
    const rival = actores[rivalIndice].personaje;

    const panel = document.createElement("section");
    panel.className = "panel";
    const titulo = document.createElement("h2");
    titulo.textContent = p.getNombre();
    panel.appendChild(titulo);

    panel.appendChild(crearSelector("Arma", catalogoArmas, p.getArma(), (arma) =>
    {
        anotar(p.cambiarArma(arma));
        escenario.habilidad(indice, arma.getIcono(), arma.getColor());
        actualizarAviso();
    }));

    panel.appendChild(crearSelector("Habilidad", catalogoHabilidades, p.getHabilidad(), (habilidad) =>
    {
        anotar(p.cambiarHabilidad(habilidad));
        escenario.habilidad(indice, habilidad.getIcono(), habilidad.getColor());
        actualizarAviso();
    }));

    const botones = document.createElement("div");
    botones.className = "botones";

    botones.appendChild(crearBoton(`⚔️ Atacar a ${rival.getNombre()}`, () =>
    {
        const posible = p.estaVivo() && rival.estaVivo();
        anotar(p.atacar(rival));
        if (posible) { escenario.embestida(indice); escenario.golpe(rivalIndice); }
    }));

    botones.appendChild(crearBoton("✨ Usar habilidad", () =>
    {
        const posible = p.estaVivo();
        anotar(p.usarHabilidad());
        if (posible) escenario.habilidad(indice, p.getHabilidad().getIcono(), p.getHabilidad().getColor());
    }));

    botones.appendChild(crearBoton("💥 Recibir 20 de daño", () =>
    {
        anotar(p.recibirDanio(20));
        escenario.golpe(indice);
    }));

    panel.appendChild(botones);
    return panel;
}

function reiniciar(): void
{
    guerrero.reiniciar();
    arquero.reiniciar();
    anotar("Los personajes recuperaron toda su vida.");
}

actores.forEach((_, indice) => contenedor.appendChild(construirPanel(indice)));
document.getElementById("reiniciar")?.addEventListener("click", reiniciar);
actualizarAviso();
anotar("Elegí un arma o una habilidad y mirá cómo cambia el personaje sin volver a crearlo.");
escenario.iniciar();
