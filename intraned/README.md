# <img src="./public/img/favicon.png" width="45" height="45" align="center"> IntranEd

**IntranEd** El proyecto "IntranEd" es un Servidor de Contenidos Educativos no solo es técnicamente sólido por su bajo consumo de recursos, sino que resuelve un problema real de soberanía digital y acceso a la información.

Al usar C++ para el backend, garantizamos que el servidor pueda correr incluso en una vieja netbook del gobierno o una computadora recuperada con apenas 2GB de RAM, cumpliendo con los objetivos de GREENSOFT.

# Isla de Conocimiento - EdTech Sostenible

Este proyecto está diseñado bajo los principios de **Desarrollo Sostenible de Software (GREENSOFT)**. Permite crear redes locales de aprendizaje en zonas con conectividad limitada.

---

## Características Técnicas
- **Backend:** C++ con `httplib` (Alto rendimiento, bajo consumo de RAM < 20MB).
- **Frontend:** HTML5, CSS3 y JavaScript Vainilla (Sin frameworks pesados, carga instantánea).
- **Persistencia:** Archivo JSON (Sin necesidad de servidores de base de datos externos).

## Impacto y Sostenibilidad
- **Bajo Consumo:** Optimizado para correr en hardware reciclado o de bajos recursos.
- **Offline-First:** Funciona de forma autónoma en intranets locales sin depender de la nube.
- **Soberanía Digital:** Gestión local de materiales educativos (PDF, Audios, Partituras).

## Características Principales
En zonas con conectividad limitada, se pueden crear "islas" de conocimiento.

* El Proyecto: Un servidor que aloje libros (PDF/EPUB), audios y partituras, permitiendo la descarga y visualización local.

* Sustentabilidad: Al evitar el renderizado del lado del servidor (SSR) y delegar la lógica al cliente con JS puro, el backend solo se encarga de servir archivos y manejar metadatos, maximizando la eficiencia energética.

* Impacto: Democratiza el acceso a materiales de estudio en escuelas o centros culturales sin depender de una conexión a internet costosa o inexistente.

## Instalación y Compilación
1. Asegúrate de tener instalado `g++`.

2. Otorga permisos de ejecución al script de compilación:
   ```bash
   chmod +x build.sh
   ```
3. Ejecutar el script build.sh o la línea de compilación directamente:
```bash
   ./build.sh
```

4. Luego ejecutar en una terminal el binario generado:
```bash
   ./build/intraned 
```

5. Abrir en un navegador web la url:
```text
   http://localhost:8080/
```

## Tecnologías Utilizadas

### Backend
* **Httplib:** Servidor robusto y escalable.
* **Json for C++:** Gestión eficiente de subida de archivos binarios.

### Frontend
* **Vanilla JavaScript:** Lógica pura sin dependencias de frameworks pesados.
* **Vanilla CSS:** Diseño con puro CSS sin frameworks.

## Estructura del Proyecto

```text
├── public/
│   ├── css/             # Estilos personalizados (style.css).
│   ├── img/             # Activos visuales (favicon.png).
│   └── js/
│       ├── admin.js     # 
│       ├── login.js     # 
│       ├── main.js      #
│       ├── public.js      #
│   ├── admin.html       # 
│   ├── index.html       #
│   ├── login.html       #
├── server/
│   ├── include/         # httplib.h y json.hpp, bibliotecas necesarias.
│   ├── build.sh         # Script de compilación.
│   ├── main.cpp         # lógica y cáclculo de servidor.
│   ├── uploads/         # Almacenamiento físico de archivos.
│   └── utils/           # Helpers de sistema de archivos (fileHelper)
│   ├── build.sh         # Script para compilar
│   ├── main.cpp         # Código del server