# PowerShell script for Windows build optimization
# This script handles Windows-specific issues like file locking and OneDrive conflicts

Write-Host "Starting Windows PowerShell build process..." -ForegroundColor Green

# Set error action preference
$ErrorActionPreference = "Continue"

# Function to safely remove directories
function Remove-DirectorySafely {
    param([string]$Path)
    
    if (Test-Path $Path) {
        try {
            Write-Host "Cleaning $Path..." -ForegroundColor Yellow
            Remove-Item -Path $Path -Recurse -Force -ErrorAction SilentlyContinue
        }
        catch {
            Write-Warning "Could not remove $Path`: $($_.Exception.Message)"
        }
    }
}

# Function to create directory if it doesn't exist
function Ensure-Directory {
    param([string]$Path)
    
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

# Clean up build directories
Write-Host "Cleaning build directories..." -ForegroundColor Yellow
Remove-DirectorySafely ".next"
Remove-DirectorySafely ".next-build"
Remove-DirectorySafely "out"

# Ensure build directory exists
Ensure-Directory ".next-build"

# Set environment variables
$env:NODE_OPTIONS = "--max-old-space-size=4096"
$env:NEXT_TELEMETRY_DISABLED = "1"

Write-Host "Starting Next.js build with Windows optimizations..." -ForegroundColor Green

# Run the build
try {
    $buildProcess = Start-Process -FilePath "npx" -ArgumentList "next", "build" -NoNewWindow -Wait -PassThru
    
    if ($buildProcess.ExitCode -eq 0) {
        Write-Host "Build completed successfully!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "Build failed with exit code $($buildProcess.ExitCode)" -ForegroundColor Red
        exit $buildProcess.ExitCode
    }
}
catch {
    Write-Host "Build process error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
