@echo off
chcp 65001 >nul
REM Instala lo necesario, compila el TypeScript, corre las pruebas y abre el servidor.
where node >nul 2>nul || (echo No encuentro Node.js. Instalalo desde https://nodejs.org (version LTS) y abri una consola nueva. & exit /b 1)

if not exist node_modules (
  echo == Instalando dependencias ==
  call npm install || exit /b 1
)

echo == Compilando TypeScript ==
call npm run build || exit /b 1

echo == Pruebas ==
call npm test || exit /b 1

echo == Servidor ==
start "" http://localhost:3000
call npm start
