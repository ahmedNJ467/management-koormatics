# Script to cleanly start the Next.js dev server
# Usage: .\scripts\start-dev-server.ps1

Write-Host "=== Starting Development Server ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill any processes using port 8080
Write-Host "Step 1: Cleaning up port 8080..." -ForegroundColor Yellow
$connections = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($connections) {
    $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($processId in $processIds) {
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "  Killing process: $($process.ProcessName) (PID: $processId)" -ForegroundColor Gray
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 2
}

# Verify port is free
$check = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($check) {
    Write-Host "  WARNING: Port 8080 is still in use!" -ForegroundColor Red
    Write-Host "  Please manually kill the process or use a different port." -ForegroundColor Red
    exit 1
} else {
    Write-Host "  ✓ Port 8080 is free" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Starting Next.js dev server..." -ForegroundColor Yellow
Write-Host "  Server will be available at: http://localhost:8080" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Start the dev server
npm run dev

