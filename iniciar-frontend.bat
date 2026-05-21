@echo off
title Mate-Matico - Frontend prueba
set "PATH=C:\Program Files\nodejs;%PATH%"

cd /d "%~dp0frontend"

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js no esta instalado.
  echo Descargalo desde https://nodejs.org e instala la version LTS.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Instalando dependencias del frontend...
  call npm install
)

if not exist ".env" (
  echo Creando frontend\.env desde .env.example...
  copy /Y ".env.example" ".env" >nul
)

echo.
echo ========================================
echo   Panel: http://localhost:5173
echo   (El backend debe estar en :3000)
echo ========================================
echo.
echo Si Google no funciona, agrega VITE_FIREBASE_API_KEY en frontend\.env
echo.

call npm run dev
pause
