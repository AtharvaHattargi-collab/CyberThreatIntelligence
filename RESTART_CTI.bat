@echo off
TITLE CTI Restarter
set "PROJECT_ROOT=%~dp0"
echo Restarting Cyber Threat Intelligence...

call "%PROJECT_ROOT%STOP_CTI.bat"
timeout /t 2 /nobreak >nul
call "%PROJECT_ROOT%START_CTI.bat"
