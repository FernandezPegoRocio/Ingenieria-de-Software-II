import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";

const PUERTO = Number(process.env.PORT ?? 3000);
const RAIZ_PUBLICA = path.resolve(__dirname, "..", "..", "public");

const TIPOS: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".map": "application/json; charset=utf-8",
    ".ico": "image/x-icon"
};

function responder(res: http.ServerResponse, codigo: number, texto: string): void
{
    res.writeHead(codigo, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(texto);
}

const servidor = http.createServer((req, res) =>
{
    const url = new URL(req.url ?? "/", "http://localhost");
    const pedido = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const archivo = path.normalize(path.join(RAIZ_PUBLICA, pedido));

    // Impide salir de la carpeta public (por ejemplo con ../)
    if (!archivo.startsWith(RAIZ_PUBLICA + path.sep))
    {
        responder(res, 403, "Acceso denegado");
        return;
    }

    fs.readFile(archivo, (error, contenido) =>
    {
        if (error)
        {
            responder(res, 404, "No encontrado");
            return;
        }
        const tipo = TIPOS[path.extname(archivo)] ?? "application/octet-stream";
        res.writeHead(200, { "Content-Type": tipo });
        res.end(contenido);
    });
});

servidor.listen(PUERTO, () =>
{
    console.log(`Servidor listo: abrí http://localhost:${PUERTO} en el navegador`);
    console.log("Para detenerlo: Ctrl + C");
});
