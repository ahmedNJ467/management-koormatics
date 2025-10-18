@echo off
echo 🚗 Deploying Fleet-Koormatics Portal...

REM Create fleet portal directory
set FLEET_DIR=fleet-portal
if exist "%FLEET_DIR%" (
    echo 📁 Removing existing fleet portal directory...
    rmdir /s /q "%FLEET_DIR%"
)

echo 📁 Creating fleet portal directory...
mkdir "%FLEET_DIR%"
cd "%FLEET_DIR%"

REM Copy necessary files
echo 📋 Copying project files...
xcopy /E /I /Y ..\src src
xcopy /E /I /Y ..\public public
copy ..\package.json .
copy ..\fleet-portal-package.json package.json
copy ..\fleet-portal.config.js next.config.js
copy ..\tailwind.config.ts .
copy ..\postcss.config.js .
copy ..\tsconfig.json .
copy ..\tsconfig.app.json .
copy ..\tsconfig.tsbuildinfo .
copy ..\components.json .
copy ..\eslint.config.js .

REM Create fleet-specific auth page
echo 🔐 Setting up fleet authentication...
if not exist "src\pages" mkdir "src\pages"
copy ..\src\pages\FleetAuth.tsx src\pages\Auth.tsx

REM Install dependencies
echo 📦 Installing dependencies...
npm install --legacy-peer-deps

REM Build the fleet portal
echo 🔨 Building fleet portal...
npm run build

echo ✅ Fleet portal built successfully!
echo 🚀 Ready for deployment to Vercel
echo.
echo To deploy:
echo 1. cd fleet-portal
echo 2. vercel --prod
echo 3. Set domain to fleet-koormatics.vercel.app

pause
