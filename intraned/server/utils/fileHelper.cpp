#include "../include/json.hpp"
#include <fstream>
#include <vector>
#include <string>

using json = nlohmann::json;

namespace FileHelper {
    const std::string METADATA_PATH = "./server/uploads/metadata.json";

    // Guarda un nuevo registro en el JSON
    bool registrarArchivo(const json& nuevoRecurso) {
        json db;
        std::ifstream fileIn(METADATA_PATH);
        
        if (fileIn.is_open()) {
            fileIn >> db;
            fileIn.close();
        } else {
            db = {{"contenidos", json::array()}};
        }

        db["contenidos"].push_back(nuevoRecurso);

        std::ofstream fileOut(METADATA_PATH);
        if (fileOut.is_open()) {
            fileOut << db.dump(4); // Indentación para legibilidad
            return true;
        }
        return false;
    }
}