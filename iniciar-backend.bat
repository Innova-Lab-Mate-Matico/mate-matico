@echo off
title Mate-Matico - Backend API
set "PATH=C:\Program Files\nodejs;%PATH%"

cd /d "%~dp0backend"

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js no esta instalado.
  echo Descargalo desde https://nodejs.org e instala la version LTS.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Instalando dependencias del backend...
  call npm install
)

if not exist ".env" (
  echo [ERROR] Falta backend\.env
  echo Copia backend\.env.example a backend\.env y completa las credenciales.
  pause
  exit /b 1
)

echo.
echo ========================================
echo   API: http://localhost:3000/api
echo   Health: http://localhost:3000/api/health
echo ========================================
echo.

call npm run dev
pause
