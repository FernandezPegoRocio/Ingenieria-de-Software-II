#!/bin/sh
# Linux / WSL
set -e
mkdir -p lib bin
F="-std=c++17 -DSEGUIMIENTO"
g++ $F -shared -fPIC -o lib/greeter.so src/greeter_component.cpp
for f in pruebas/componentes/*.cpp; do g++ $F -shared -fPIC -o lib/$(basename $f .cpp).so $f; done
g++ $F -pthread -o bin/pruebas pruebas/pruebas.cpp -ldl
g++ $F -o bin/exit_vs_excepcion pruebas/exit_vs_excepcion.cpp
g++ $F -o bin/prueba_terminate pruebas/prueba_terminate.cpp -ldl
g++ $F -o bin/seguimiento_host main.cpp -ldl
g++ $F -pthread -fsanitize=thread -g -o bin/hilos_con pruebas/hilos.cpp -ldl
g++ $F -DSIN_MUTEX -pthread -fsanitize=thread -g -o bin/hilos_sin pruebas/hilos.cpp -ldl
echo "Listo. Ejecuta: ./bin/pruebas"
