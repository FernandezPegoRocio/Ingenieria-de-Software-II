@echo off
chcp 65001 >nul
REM Requiere MSYS2 MinGW-w64 (g++ con hilos "posix") en el PATH.  Ver LEEME.md
setlocal
REM Si MSYS2 esta instalado, usar SU g++ antes que cualquier otro (el MinGW viejo 6.3 no sirve)
if exist C:\msys64\ucrt64\bin\g++.exe set PATH=C:\msys64\ucrt64\bin;%PATH%
where g++ >nul 2>nul || (echo No encuentro g++. Instala MSYS2 y agrega C:\msys64\ucrt64\bin al PATH. & exit /b 1)
if not exist lib mkdir lib
if not exist bin mkdir bin
echo Compilador que se va a usar:
where g++
g++ --version | findstr /i "g++"
set FLAGS=-std=c++17 -DSEGUIMIENTO

echo == Componentes (DLL) ==
g++ %FLAGS% -shared -o lib\greeter.dll src\greeter_component.cpp || exit /b 1
for %%f in (pruebas\componentes\*.cpp) do (
  g++ %FLAGS% -shared -o lib\%%~nf.dll %%f || exit /b 1
)

echo == Programas ==
g++ %FLAGS% -pthread -o bin\pruebas.exe pruebas\pruebas.cpp || exit /b 1
g++ %FLAGS% -o bin\exit_vs_excepcion.exe pruebas\exit_vs_excepcion.cpp || exit /b 1
g++ %FLAGS% -o bin\prueba_terminate.exe pruebas\prueba_terminate.cpp || exit /b 1
g++ %FLAGS% -o bin\seguimiento_host.exe main.cpp || exit /b 1

echo.
echo Listo. Ejecuta:  bin\pruebas.exe
