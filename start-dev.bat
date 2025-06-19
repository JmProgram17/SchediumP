@echo off
title Schedium Development Server

:: Schedium Development Server for Windows
:: Ejecuta tanto el backend como el frontend en modo desarrollo

echo.
echo ================================
echo  Schedium Development Server
echo ================================
echo.

:: Verificar si estamos en el directorio correcto
if not exist "Schedium-BE" (
    echo ERROR: Este script debe ejecutarse desde el directorio raiz de Schedium
    echo Asegurate de estar en el directorio que contiene Schedium-BE y Schedium-FE
    pause
    exit /b 1
)

if not exist "Schedium-FE" (
    echo ERROR: Este script debe ejecutarse desde el directorio raiz de Schedium
    echo Asegurate de estar en el directorio que contiene Schedium-BE y Schedium-FE
    pause
    exit /b 1
)

echo [1/4] Verificando dependencias...

:: Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no esta instalado
    pause
    exit /b 1
)

:: Verificar Node.js
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js/npm no esta instalado
    pause
    exit /b 1
)

echo ✓ Dependencias verificadas
echo.

echo [2/4] Configurando Backend...
cd Schedium-BE

:: Crear virtual environment si no existe
if not exist "venv" (
    echo Creando virtual environment...
    python -m venv venv
)

:: Activar virtual environment
call venv\Scripts\activate.bat

:: Instalar dependencias si es necesario
if not exist "venv\.installed" (
    echo Instalando dependencias del backend...
    pip install -r requirements.txt
    pip install -r requirements-dev.txt
    echo. > venv\.installed
)

cd ..
echo ✓ Backend configurado
echo.

echo [3/4] Configurando Frontend...
cd Schedium-FE

:: Instalar dependencias si es necesario
if not exist "node_modules" (
    echo Instalando dependencias del frontend...
    npm install
)

cd ..
echo ✓ Frontend configurado
echo.

echo [4/4] Iniciando servidores...
echo.

:: Configurar variables de entorno
set VITE_API_URL=http://localhost:8000
set VITE_APP_ENV=development

echo Iniciando Backend en puerto 8000...
cd Schedium-BE
call venv\Scripts\activate.bat
start "Schedium Backend" cmd /k "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
cd ..

echo Esperando a que el backend se inicie...
timeout /t 3 /nobreak >nul

echo Iniciando Frontend en puerto 3000...
cd Schedium-FE
start "Schedium Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ================================
echo  Servidores iniciados!
echo ================================
echo.
echo Backend (FastAPI):  http://localhost:8000
echo API Docs:          http://localhost:8000/docs
echo Frontend (React):  http://localhost:3000
echo.
echo Presiona cualquier tecla para salir...
pause >nul