@echo off
echo Iniciando Mate-Matico (backend + frontend)...
echo Si los puertos estan ocupados, ejecuta detener-todo.bat primero.
echo.
start "Mate-Matico API" cmd /k "%~dp0iniciar-backend.bat"
ping 127.0.0.1 -n 4 >nul
start "Mate-Matico Front" cmd /k "%~dp0iniciar-frontend.bat"
echo.
echo Se abrieron 2 ventanas:
echo   - Backend  http://localhost:3000/api
echo   - Frontend http://localhost:5173
echo.
