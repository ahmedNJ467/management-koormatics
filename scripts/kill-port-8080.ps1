# Script to kill processes using port 8080
# Usage: .\scripts\kill-port-8080.ps1

Write-Host "Checking for processes using port 8080..." -ForegroundColor Yellow

$connections = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue

if ($connections) {
    $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($processId in $processIds) {
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Found process: $($process.ProcessName) (PID: $processId)" -ForegroundColor Red
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Write-Host "Killed process PID: $processId" -ForegroundColor Green
        }
    }
    Write-Host "Attempted to kill processes on port 8080" -ForegroundColor Yellow
} else {
    Write-Host "No processes found using port 8080." -ForegroundColor Green
}

# Wait a moment for processes to fully terminate
Start-Sleep -Seconds 2

# Verify port is free
$check = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if (-not $check) {
    Write-Host "Port 8080 is now available!" -ForegroundColor Green
} else {
    $remainingPids = $check | Select-Object -ExpandProperty OwningProcess -Unique
    Write-Host "Warning: Port 8080 is still in use by PIDs: $($remainingPids -join ', ')" -ForegroundColor Red
    Write-Host "Attempting to force kill remaining processes..." -ForegroundColor Yellow
    foreach ($processId in $remainingPids) {
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
    $finalCheck = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
    if (-not $finalCheck) {
        Write-Host "Port 8080 is now available!" -ForegroundColor Green
    } else {
        Write-Host "Error: Could not free port 8080. Please kill processes manually." -ForegroundColor Red
    }
}

