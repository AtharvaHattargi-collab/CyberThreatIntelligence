@echo off
TITLE CTI Stopper
echo Stopping Cyber Threat Intelligence...

echo Stopping Backend (python.exe running uvicorn on port 8001)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001') do (
    taskkill /F /PID %%a 2>nul
)

echo Stopping Frontend (node.exe running vite on port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    taskkill /F /PID %%a 2>nul
)

echo CTI services stopped.
pause
