@echo off
echo Iniciando Mate Mático (backend + frontend)...
echo Si los puertos están ocupados, ejecutá detener-todo.bat primero.
echo.
start "Mate Mático API" cmd /k "%~dp0iniciar-backend.bat"
ping 127.0.0.1 -n 4 >nul
start "Mate Mático Front" cmd /k "%~dp0iniciar-frontend.bat"
echo.
echo Se abrieron 2 ventanas:
echo   - Backend  http://localhost:3000/api
echo   - Frontend http://localhost:3001
echo.
