@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"

echo === Verificacion Mate-Matico ===
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [X] Node.js NO encontrado
  echo     Instala desde https://nodejs.org
) else (
  for /f "delims=" %%v in ('node -v') do echo [OK] Node %%v
  for /f "delims=" %%v in ('npm -v') do echo [OK] npm %%v
)

echo.
if exist "%~dp0backend\.env" (echo [OK] backend\.env) else (echo [X] Falta backend\.env)
if exist "%~dp0frontend\.env" (echo [OK] frontend\.env) else (echo [X] Falta frontend\.env)

findstr /B "FIREBASE_WEB_API_KEY=$" "%~dp0backend\.env" >nul 2>&1
if not errorlevel 1 echo [!] FIREBASE_WEB_API_KEY vacia en backend - login email/Google limitado

findstr /B "VITE_FIREBASE_API_KEY=$" "%~dp0frontend\.env" >nul 2>&1
if not errorlevel 1 echo [!] VITE_FIREBASE_API_KEY vacia - Google en el panel no funcionara

echo.
curl.exe -s http://localhost:3000/api/health >nul 2>&1
if errorlevel 1 (
  echo [--] Backend no responde en :3000 - ejecuta iniciar-backend.bat
) else (
  echo [OK] Backend respondiendo en http://localhost:3000/api/health
)

curl.exe -s http://localhost:5173/ >nul 2>&1
if errorlevel 1 (
  echo [--] Frontend no responde en :5173 - ejecuta iniciar-frontend.bat
) else (
  echo [OK] Frontend respondiendo en http://localhost:5173
)

echo.
pause
