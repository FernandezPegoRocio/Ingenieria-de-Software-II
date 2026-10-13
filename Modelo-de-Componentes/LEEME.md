# Seguimiento práctico del modelo de componentes

Código del repo cpp-component-model (Gabriel Ferreira, MIT) con **trazas** que muestran qué hace el
Host y qué hace el componente, más pruebas para los 5 puntos de la consigna.

## Windows (lo tuyo)
1. Instalá MSYS2 (https://www.msys2.org) y en la terminal "MSYS2 UCRT64": `pacman -S mingw-w64-ucrt-x86_64-gcc`
2. Agregá `C:\msys64\ucrt64\bin` al PATH de Windows.
3. Abrí `cmd` en esta carpeta y corré: `compilar_windows.bat`
4. Ejecutá: `bin\pruebas.exe`  (también `bin\exit_vs_excepcion.exe exit` y `... excepcion`, `bin\prueba_terminate.exe`)

Notas: usá el g++ de MSYS2 (no el de Strawberry/Code::Blocks viejo: necesitás hilos "posix" para std::thread).
Si ves símbolos raros en la consola, el .bat ya hace `chcp 65001`.

## Linux / WSL
`./compilar_linux.sh` y luego `./bin/pruebas`. Solo acá: ThreadSanitizer
(`./bin/hilos_con` no informa nada; `./bin/hilos_sin` informa "data race").

## Qué prueba cada punto
1. ABI segura: `pruebas` (Punto 1) y `prueba_terminate` (noexcept + throw = terminate)
2. Sin excepciones cruzadas: `pruebas` (Punto 2)
3. Memoria cruzada: `pruebas` (Punto 3), contador de referencias de la biblioteca
4. Hilos: `pruebas` (Punto 4) + ThreadSanitizer en Linux
5. Sin std::exit: `exit_vs_excepcion exit|excepcion`

Definí `SEGUIMIENTO_SILENCIO=1` para apagar las trazas.
