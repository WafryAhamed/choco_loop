@echo off
setlocal
cd /d "%~dp0"

echo Chocolate Warehouse - starting services...
echo Ports: Backend 5000 ^| Frontend Vite 5173 ^| Vision 8001
echo Requires XAMPP MySQL on port 3308 ^(see backend\.env^) and database chocolate_warehouse_db
echo.

if not exist "%~dp0vision\venv\Scripts\python.exe" (
  echo Creating vision virtual environment...
  cd /d "%~dp0vision"
  python -m venv venv
  if errorlevel 1 (
    echo Failed to create venv. Install Python 3 and retry.
    pause
    exit /b 1
  )
  call venv\Scripts\activate.bat
  pip install -r requirements.txt
  cd /d "%~dp0"
)

if not exist "%~dp0backend\node_modules" (
  echo Installing backend dependencies...
  cd /d "%~dp0backend"
  call npm install
  if errorlevel 1 (
    echo Backend npm install failed.
    pause
    exit /b 1
  )
  cd /d "%~dp0"
)

if not exist "%~dp0frontend\node_modules" (
  echo Installing frontend dependencies...
  cd /d "%~dp0frontend"
  call npm install
  if errorlevel 1 (
    echo Frontend npm install failed.
    pause
    exit /b 1
  )
  cd /d "%~dp0"
)

echo Starting Backend...
start "Backend Server" cmd /k "cd /d ""%~dp0backend"" & npm run dev"

echo Waiting for backend on port 5000...
timeout /t 4 /nobreak >nul

echo Starting Frontend...
start "Frontend Server" cmd /k "cd /d ""%~dp0frontend"" & npm run dev"

echo Starting Vision Server...
start "Vision Server" cmd /k "cd /d ""%~dp0vision"" & venv\Scripts\python.exe app.py"

echo.
echo All servers launched in separate windows.
echo If a port is busy: netstat -ano ^| findstr :5000 ^| findstr :5173 ^| findstr :8001
endlocal
