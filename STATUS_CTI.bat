@echo off
TITLE CTI Status Checker
echo Checking Backend Status (http://127.0.0.1:8001/api/health)...
curl -s -f -o nul http://127.0.0.1:8001/api/health
if %errorlevel% equ 0 (
    echo [OK] Backend is ONLINE
) else (
    echo [FAIL] Backend is OFFLINE
)

echo.
echo Checking Frontend Status (http://localhost:5173)...
curl -s -f -o nul http://localhost:5173
if %errorlevel% equ 0 (
    echo [OK] Frontend is ONLINE
) else (
    echo [FAIL] Frontend is OFFLINE
)
echo.
pause
