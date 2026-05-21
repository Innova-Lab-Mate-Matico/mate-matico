@echo off
title Mate-Matico - Detener servidores
cd /d "%~dp0"

echo Liberando puertos 3000, 5173 y 5174...
echo.

call :liberarPuerto 3000
call :liberarPuerto 5173
call :liberarPuerto 5174

echo.
echo Listo. Podes volver a ejecutar iniciar-todo.bat
echo.
pause
exit /b 0

:liberarPuerto
set "PUERTO=%~1"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PUERTO%" ^| findstr "LISTENING"') do (
  echo   Cerrando PID %%a en puerto %PUERTO%
  taskkill /F /PID %%a >nul 2>&1
)
exit /b 0
