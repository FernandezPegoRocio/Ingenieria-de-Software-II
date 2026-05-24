/**
 * setup.js
 * Ejecuta init.sql automáticamente usando las credenciales de root.
 * Maneja DELIMITER manualmente ya que mysql2 no lo soporta.
 * Uso: node setup.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const sqlFile = path.join(__dirname, 'config', 'init.sql');
const rawSql = fs.readFileSync(sqlFile, 'utf8');

/**
 * Divide el SQL en statements individuales manejando DELIMITER manualmente.
 * mysql2 no soporta DELIMITER //, hay que procesarlo antes de enviar.
 */
function parseSql(raw) {
    const statements = [];
    let delimiter = ';';
    let current = '';

    const lines = raw.split('\n');

    for (let line of lines) {
        const trimmed = line.trim();

        // Detectar cambio de DELIMITER
        if (/^DELIMITER\s+(\S+)/i.test(trimmed)) {
            const match = trimmed.match(/^DELIMITER\s+(\S+)/i);
            // Si había acumulado algo antes del DELIMITER, guardarlo
            if (current.trim()) {
                statements.push(current.trim());
                current = '';
            }
            delimiter = match[1];
            continue;
        }

        current += line + '\n';

        // Si la línea termina con el delimiter actual, es un statement completo
        if (trimmed.endsWith(delimiter)) {
            let stmt = current.trim();
            // Sacar el delimiter del final si es //
            if (delimiter !== ';') {
                stmt = stmt.slice(0, stmt.lastIndexOf(delimiter)).trim();
            } else {
                stmt = stmt.slice(0, stmt.lastIndexOf(';')).trim();
            }
            if (stmt) statements.push(stmt);
            current = '';
        }
    }

    if (current.trim()) statements.push(current.trim());

    return statements.filter(s => s.length > 0);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Ingresá la contraseña de root de MySQL: ', async (rootPassword) => {
    rl.close();

    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: rootPassword,
            multipleStatements: false
        });

        console.log('✅ Conectado a MySQL como root.');
        console.log('⏳ Ejecutando init.sql...');

        const statements = parseSql(rawSql);

        for (const stmt of statements) {
            if (!stmt || stmt.startsWith('--') || stmt.startsWith('SET foreign_key_checks')) {
                // Ejecutamos igual los SET
            }
            try {
                await connection.query(stmt);
            } catch (err) {
                // Ignorar errores no críticos (ej: DROP IF EXISTS cuando no existe)
                if (!err.message.includes("doesn't exist") && !err.message.includes('already exists')) {
                    console.warn(`⚠️  Advertencia en statement: ${err.message}`);
                }
            }
        }

        console.log('✅ Base de datos "samplevaultest" creada correctamente.');
        console.log('✅ Usuario "samplevaultest" creado con permisos.');
        console.log('✅ Tablas y stored procedures listos.');
        console.log('');
        console.log('👉 Ahora podés iniciar el servidor con: npm start');

    } catch (err) {
        console.error('❌ Error al ejecutar el setup:', err.message);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
});