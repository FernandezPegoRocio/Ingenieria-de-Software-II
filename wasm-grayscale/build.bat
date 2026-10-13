@echo off
REM Requiere LLVM para Windows (incluye clang y wasm-ld): https://github.com/llvm/llvm-project/releases
clang --target=wasm32 -O3 -nostdlib -Wl,--no-entry -Wl,--export-dynamic -o grayscale.wasm grayscale.c
if errorlevel 1 (echo Error al compilar & exit /b 1)
dir grayscale.wasm
