@echo off
echo Iniciando Mate-Matico (backend + frontend)...
echo Si los puertos estan ocupados, ejecuta detener-todo.bat primero.
echo.
start "Mate-Matico API" cmd /k "%~dp0iniciar-backend.bat"
ping 127.0.0.1 -n 4 >nul
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:3000/api/health' -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
  echo [ERROR] El backend no pudo iniciarse en http://localhost:3000/api.
  echo Revisá la ventana "Mate-Matico API" y ejecutá detener-todo.bat si el puerto está ocupado.
  pause
  exit /b 1
)
start "Mate-Matico Front" cmd /k "%~dp0iniciar-frontend.bat"
echo.
echo Se abrieron 2 ventanas:
echo   - Backend  http://localhost:3000/api
echo   - Frontend http://localhost:5173
echo.
