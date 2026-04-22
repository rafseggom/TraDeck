@echo off
setlocal

set "ROOT=%~dp0"

echo [TraDeck] Preparando entorno local...

if not exist "%ROOT%backend\node_modules" (
  echo [TraDeck] Instalando dependencias de backend...
  cd /d "%ROOT%backend"
  call npm.cmd install
  if errorlevel 1 goto :error
  cd /d "%ROOT%"
)

if not exist "%ROOT%frontend\node_modules" (
  echo [TraDeck] Instalando dependencias de frontend...
  cd /d "%ROOT%frontend"
  call npm.cmd install
  if errorlevel 1 goto :error
  cd /d "%ROOT%"
)

if not exist "%ROOT%frontend\.env" (
  if exist "%ROOT%frontend\.env.example" (
    echo [TraDeck] Creando frontend/.env desde .env.example...
    copy /Y "%ROOT%frontend\.env.example" "%ROOT%frontend\.env" >nul
  )
)

if not exist "%ROOT%backend\.env" (
  if exist "%ROOT%backend\.env.pinata.example" (
    echo [TraDeck] Creando backend/.env desde .env.pinata.example...
    copy /Y "%ROOT%backend\.env.pinata.example" "%ROOT%backend\.env" >nul
  )
)

echo [TraDeck] Lanzando nodo Hardhat en nueva ventana...
start "TraDeck - Hardhat Node" cmd /k "cd /d ""%ROOT%backend"" && npm.cmd run node"

call :wait_for_port 8545 45
if errorlevel 1 (
  echo [TraDeck] No se pudo detectar el puerto 8545 a tiempo.
  goto :error
)

echo [TraDeck] Desplegando contratos en red local...
cd /d "%ROOT%backend"
call npm.cmd run deploy:local
if errorlevel 1 goto :error

echo [TraDeck] Sincronizando direcciones en frontend/.env...
call npm.cmd run sync:env:local
if errorlevel 1 goto :error

cd /d "%ROOT%"

echo [TraDeck] Lanzando proxy Pinata en nueva ventana...
start "TraDeck - Pinata Proxy" cmd /k "cd /d ""%ROOT%backend"" && npm.cmd run pinata:proxy"

echo [TraDeck] Lanzando frontend en nueva ventana...
start "TraDeck - Frontend" cmd /k "cd /d ""%ROOT%frontend"" && npm.cmd run dev"

echo [TraDeck] Listo. Ventanas abiertas: Hardhat node, Pinata proxy y Frontend.
exit /b 0

:wait_for_port
set "PORT=%~1"
set "MAX_TRIES=%~2"
for /l %%i in (1,1,%MAX_TRIES%) do (
  powershell -NoProfile -Command "$ok = Test-NetConnection -ComputerName 127.0.0.1 -Port %PORT% -WarningAction SilentlyContinue; if ($ok.TcpTestSucceeded) { exit 0 } else { exit 1 }" >nul 2>nul
  if not errorlevel 1 exit /b 0
  timeout /t 1 /nobreak >nul
)
exit /b 1

:error
cd /d "%ROOT%"
echo [TraDeck] Error durante el arranque local.
exit /b 1
