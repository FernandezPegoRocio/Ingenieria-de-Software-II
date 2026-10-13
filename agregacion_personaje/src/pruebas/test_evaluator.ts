/**
 * Contador mínimo de pruebas (sin librerías externas), al estilo del TestEvaluator del apunte.
 */
export class TestEvaluator
{
    private aprobadas = 0;
    private fallidas = 0;

    titulo(texto: string): void
    {
        console.log(`\n${texto}`);
    }

    evaluar(descripcion: string, condicion: boolean): void
    {
        if (condicion)
        {
            this.aprobadas++;
            console.log(`  [OK]    ${descripcion}`);
        }
        else
        {
            this.fallidas++;
            console.log(`  [FALLA] ${descripcion}`);
        }
    }

    resumen(): boolean
    {
        console.log(`\nPruebas aprobadas: ${this.aprobadas}, fallidas: ${this.fallidas}`);
        return this.fallidas === 0;
    }
}
