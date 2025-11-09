@echo off
REM Script to kill processes using port 8080 on Windows
REM Usage: scripts\kill-port-8080.bat

echo Checking for processes using port 8080...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
    echo Found process using port 8080: PID %%a
    taskkill /PID %%a /F >nul 2>&1
    if errorlevel 1 (
        echo Failed to kill process PID: %%a
    ) else (
        echo Successfully killed process PID: %%a
    )
)

timeout /t 2 /nobreak >nul
netstat -ano | findstr :8080 >nul
if errorlevel 1 (
    echo Port 8080 is now free!
) else (
    echo Warning: Port 8080 is still in use!
)

pause

