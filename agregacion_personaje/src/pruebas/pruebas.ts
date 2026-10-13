import { Personaje } from "../modelo/personaje.js";
import { Arma } from "../modelo/arma.js";
import { Curacion, EscudoMagico, Furia } from "../modelo/habilidades.js";
import type { IArma } from "../modelo/i_arma.js";
import type { IHabilidad, IObjetivoDeHabilidad } from "../modelo/i_habilidad.js";
import { TestEvaluator } from "./test_evaluator.js";

// ============================================
// MOCKS: implementaciones falsas de las interfaces
// ============================================

class MockArma implements IArma
{
    consultasDeDanio = 0;
    constructor(private readonly danio: number, private readonly nombre: string = "Mock") {}
    getNombre(): string { return this.nombre; }
    getDanio(): number { this.consultasDeDanio++; return this.danio; }
    getIcono(): string { return "?"; }
    getColor(): string { return "#000"; }
}

class MockHabilidad implements IHabilidad
{
    vecesUsada = 0;
    ultimoObjetivo: IObjetivoDeHabilidad | null = null;
    getNombre(): string { return "Mock"; }
    getPoder(): number { return 0; }
    getIcono(): string { return "?"; }
    getColor(): string { return "#000"; }
    usar(objetivo: IObjetivoDeHabilidad): string
    {
        this.vecesUsada++;
        this.ultimoObjetivo = objetivo;
        return "efecto simulado";
    }
}

function nuevoPersonaje(nombre: string, vida: number, arma: IArma = new MockArma(10), habilidad: IHabilidad = new MockHabilidad()): Personaje
{
    return new Personaje(nombre, vida, arma, habilidad);
}

// ============================================
// PRUEBAS (Arrange / Act / Assert)
// ============================================

function pruebaUsaElArmaInyectada(te: TestEvaluator): void
{
    // Arrange
    const arma = new MockArma(30);
    const atacante = nuevoPersonaje("A", 100, arma);
    const rival = nuevoPersonaje("B", 100);
    // Act
    atacante.atacar(rival);
    // Assert
    te.evaluar("el personaje consultó el daño al arma que le inyectaron", arma.consultasDeDanio === 1);
    te.evaluar("el rival perdió exactamente el daño del arma (100 - 30 = 70)", rival.getVida() === 70);
}

function pruebaCambiarArmaEnEjecucion(te: TestEvaluator): void
{
    const atacante = nuevoPersonaje("A", 100, new MockArma(10));
    const rival = nuevoPersonaje("B", 100);

    atacante.atacar(rival);
    te.evaluar("con el arma de 10 de daño, el rival queda en 90", rival.getVida() === 90);

    const nueva = new MockArma(25);
    atacante.cambiarArma(nueva);
    atacante.atacar(rival);
    te.evaluar("tras cambiar el arma, el MISMO personaje hace 25 (90 - 25 = 65)", rival.getVida() === 65);
    te.evaluar("getArma() devuelve la nueva arma", atacante.getArma() === nueva);
}

function pruebaCambiarHabilidadEnEjecucion(te: TestEvaluator): void
{
    const primera = new MockHabilidad();
    const segunda = new MockHabilidad();
    const personaje = nuevoPersonaje("A", 100, new MockArma(1), primera);

    personaje.usarHabilidad();
    personaje.cambiarHabilidad(segunda);
    personaje.usarHabilidad();

    te.evaluar("la primera habilidad se usó una vez", primera.vecesUsada === 1);
    te.evaluar("tras el cambio se usa la segunda habilidad", segunda.vecesUsada === 1);
    te.evaluar("la habilidad recibe al personaje como objetivo", segunda.ultimoObjetivo === personaje);
}

function pruebaCuracionNoSuperaElMaximo(te: TestEvaluator): void
{
    const personaje = new Personaje("A", 100, new MockArma(1), new Curacion(25));
    personaje.recibirDanio(10);
    personaje.usarHabilidad();
    te.evaluar("la curación no pasa de la vida máxima (90 + 25 -> 100)", personaje.getVida() === 100);
}

function pruebaEscudoAbsorbeDanio(te: TestEvaluator): void
{
    const personaje = new Personaje("A", 100, new MockArma(1), new EscudoMagico(15));
    personaje.usarHabilidad();
    te.evaluar("el escudo mágico suma 15 de escudo", personaje.getEscudo() === 15);

    personaje.recibirDanio(20);
    te.evaluar("el escudo absorbe 15 y la vida baja solo 5", personaje.getVida() === 95 && personaje.getEscudo() === 0);
}

function pruebaFuriaDuplicaUnSoloAtaque(te: TestEvaluator): void
{
    const atacante = new Personaje("A", 100, new MockArma(10), new Furia());
    const rival = nuevoPersonaje("B", 100);

    atacante.usarHabilidad();
    te.evaluar("tras usar Furia el personaje está furioso", atacante.estaFurioso());

    atacante.atacar(rival);
    te.evaluar("el primer ataque hace el doble (20)", rival.getVida() === 80);
    te.evaluar("la furia se consume", !atacante.estaFurioso());

    atacante.atacar(rival);
    te.evaluar("el segundo ataque vuelve a hacer 10", rival.getVida() === 70);
}

function pruebaInstanciaCompartida(te: TestEvaluator): void
{
    const arco = new Arma("Arco mágico", 20, "🏹", "#fff");
    const a = nuevoPersonaje("A", 100, arco);
    const b = nuevoPersonaje("B", 80, arco);

    te.evaluar("dos personajes pueden usar el MISMO objeto Arma (agregación)", a.getArma() === b.getArma());

    a.cambiarArma(new Arma("Espada", 30, "🗡️", "#fff"));
    te.evaluar("al cambiar el arma de uno, el otro conserva la suya", b.getArma() === arco);
}

function pruebaDerrotado(te: TestEvaluator): void
{
    const atacante = nuevoPersonaje("A", 100, new MockArma(10));
    const rival = nuevoPersonaje("B", 5);

    atacante.atacar(rival);
    te.evaluar("la vida nunca baja de 0", rival.getVida() === 0 && !rival.estaVivo());

    const mensaje = rival.atacar(atacante);
    te.evaluar("un personaje derrotado no puede atacar", mensaje.includes("derrotado") && atacante.getVida() === 100);

    te.evaluar("un derrotado no sigue recibiendo daño", rival.recibirDanio(20).includes("ya está derrotado"));

    rival.reiniciar();
    te.evaluar("reiniciar() devuelve la vida máxima", rival.getVida() === 5 && rival.estaVivo());
}

// ============================================
// EJECUCIÓN
// ============================================

const te = new TestEvaluator();
te.titulo("Personaje - Pruebas de agregación:");
pruebaUsaElArmaInyectada(te);
pruebaCambiarArmaEnEjecucion(te);
pruebaCambiarHabilidadEnEjecucion(te);
pruebaCuracionNoSuperaElMaximo(te);
pruebaEscudoAbsorbeDanio(te);
pruebaFuriaDuplicaUnSoloAtaque(te);
pruebaInstanciaCompartida(te);
pruebaDerrotado(te);

process.exit(te.resumen() ? 0 : 1);
