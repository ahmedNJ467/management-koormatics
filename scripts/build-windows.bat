@echo off
echo Starting Windows build process...

REM Set environment variables
set NODE_OPTIONS=--max-old-space-size=4096
set NEXT_TELEMETRY_DISABLED=1
set NODE_ENV=production

REM Clean build directories
echo Cleaning build directories...
if exist .next rmdir /s /q .next
if exist .next-build rmdir /s /q .next-build
if exist out rmdir /s /q out

REM Create build directory
if not exist .next-build mkdir .next-build

REM Kill ALL Node processes more aggressively
echo Killing all Node processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.exe 2>nul
taskkill /f /im npx.exe 2>nul
taskkill /f /im next.exe 2>nul

REM Wait longer for processes to terminate
echo Waiting for processes to terminate...
timeout /t 5 /nobreak >nul

REM Try to unlock any locked files
echo Attempting to unlock files...
takeown /f . /r /d y 2>nul
icacls . /grant %USERNAME%:F /t 2>nul

REM Try building with different approaches
echo Attempting build method 1: Direct next build...
npx next build
if %ERRORLEVEL% EQU 0 goto success

echo Build method 1 failed, trying method 2: Node directly...
node node_modules/next/dist/bin/next build
if %ERRORLEVEL% EQU 0 goto success

echo Build method 2 failed, trying method 3: With different options...
set NODE_OPTIONS=--max-old-space-size=8192
npx next build --no-lint
if %ERRORLEVEL% EQU 0 goto success

echo All build methods failed
exit /b 1

:success
echo Build completed successfully!
exit /b 0
