/**
 * @file main.cpp
 * @author Gabriel Nicolás González Ferreira
 * @brief Servidor principal - Versión de alta compatibilidad (POSIX)
 * @version 0.4
 *
 * Cambios respecto a v0.3:
 *   - httplib.h se enlaza como biblioteca dinámica (libhttplib.so / httplib.dll).
 *     Se agrega la macro CPPHTTPLIB_COMPILE para que el header solo exponga
 *     declaraciones; la implementación vive en libhttplib.so.
 *   - json.hpp se enlaza como biblioteca dinámica (libjson.so / json.dll).
 *     No requiere macro especial: el header sigue siendo el mismo.
 *   - El resto del archivo main.cpp NO cambia.
 */

// ── Carga dinámica de httplib ────────────────────────────────────────────────
// Con CPPHTTPLIB_COMPILE el header declara pero no define.
// La implementación fue compilada en libhttplib.so (ver server/lib/httplib_lib.cpp).
#define CPPHTTPLIB_COMPILE
#include "include/httplib.h"

// ── Carga dinámica de json ───────────────────────────────────────────────────
// libjson.so contiene la compilación de json.hpp (ver server/lib/json_lib.cpp).
// El include aquí es idéntico al original; el enlazador resuelve contra .so.
#include "include/json.hpp"

// ── Resto del código sin modificaciones ─────────────────────────────────────
#include "utils/fileHelper.cpp"

#include <iostream>
#include <fstream>
#include <sys/stat.h>   // Para mkdir y stat (POSIX)
#include <sys/types.h>

using json = nlohmann::json;

// Función auxiliar simple para asegurar que el directorio existe
void asegurar_directorio(const std::string& path) {
    struct stat info;
    // Si stat falla, el directorio probablemente no existe
    if (stat(path.c_str(), &info) != 0) {
        // Creamos el directorio con permisos 0777 (rwxrwxrwx)
#ifdef _WIN32
        mkdir(path.c_str());
#else
        mkdir(path.c_str(), 0777);
#endif
    }
}

const std::string ADMIN_TOKEN = "educacion_libre_2026";

int main()
{
    const std::string upload_dir = "./server/uploads";
    asegurar_directorio(upload_dir);

    httplib::Server svr;

    svr.set_mount_point("/", "./public");
    svr.set_mount_point("/recursos", upload_dir);

    // Ruta de Login
    svr.Post("/api/login", [](const httplib::Request &req, httplib::Response &res) {
        try {
            auto j_input = json::parse(req.body);
            if (j_input["password"] == "admin123") {
                res.set_content("{\"token\": \"" + ADMIN_TOKEN + "\"}", "application/json");
            } else {
                res.status = 401;
                res.set_content("{\"error\": \"No autorizado\"}", "application/json");
            }
        } catch (...) {
            res.status = 400;
            res.set_content("{\"error\": \"JSON invalido\"}", "application/json");
        }
    });

    // Obtener contenidos
    svr.Get("/api/contenidos", [&](const httplib::Request &, httplib::Response &res) {
        std::ifstream file(upload_dir + "/metadata.json");
        if (file.is_open()) {
            json db;
            file >> db;
            res.set_content(db.dump(), "application/json");
        } else {
            res.set_content("{\"contenidos\": []}", "application/json");
        }
    });

    // Ruta de Upload
    svr.Post("/api/upload", [&upload_dir](const httplib::Request &req, httplib::Response &res) {
        if (req.get_header_value("Authorization") != ADMIN_TOKEN) {
            res.status = 403;
            res.set_content("{\"error\": \"Token invalido\"}", "application/json");
            return;
        }

        if (!req.form.has_file("archivo")) {
            res.status = 400;
            res.set_content("{\"error\": \"Falta el archivo\"}", "application/json");
            return;
        }

        const auto &file_part = req.form.get_file("archivo");
        std::string titulo    = req.form.get_field("titulo");
        std::string autor     = req.form.get_field("autor");
        std::string tema      = req.form.get_field("tema");
        std::string filename  = file_part.filename;
        std::string path      = upload_dir + "/" + filename;

        std::ofstream ofs(path, std::ios::binary);
        if (ofs.is_open()) {
            ofs << file_part.content;
            ofs.close();

            json nuevo = {
                {"titulo", titulo},
                {"autor",  autor},
                {"tema",   tema},
                {"file",   filename}
            };

            if (FileHelper::registrarArchivo(nuevo)) {
                res.set_content("{\"status\": \"success\"}", "application/json");
            } else {
                res.status = 500;
                res.set_content("{\"error\": \"Error en metadata\"}", "application/json");
            }
        } else {
            res.status = 500;
            res.set_content("{\"error\": \"Error de E/S en disco\"}", "application/json");
        }
    });

    std::cout << "Servidor iniciado en http://localhost:8080 (Modo compatibilidad POSIX)" << std::endl;
    svr.listen("0.0.0.0", 8080);

    return 0;
}