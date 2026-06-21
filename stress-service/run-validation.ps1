#!/usr/bin/env powershell

# Script to start stress-service and validate it
# This script is designed for Windows PowerShell

param(
    [switch]$verbose = $false,
    [int]$timeout = 30,
    [string]$port = "3005"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  STRESS SERVICE VALIDATION WORKFLOW" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check if stress-service is running
Write-Host "[1/4] Checking if stress-service is running on port $port..." -ForegroundColor Yellow
$serviceRunning = Get-Process node -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -match "app\.js|npm.*dev"
}

if ($serviceRunning) {
    Write-Host "✓ Stress-service is already running" -ForegroundColor Green
    $existingService = $true
} else {
    Write-Host "✗ Stress-service is NOT running" -ForegroundColor Red
    $existingService = $false
}

# 2. Start service if not running
if (-not $existingService) {
    Write-Host ""
    Write-Host "[2/4] Starting stress-service..." -ForegroundColor Yellow
    
    try {
        # Navigate to stress-service directory
        $stressServicePath = Split-Path -Parent $MyInvocation.MyCommand.Path
        if (-not (Test-Path "$stressServicePath/src/app.js")) {
            $stressServicePath = "C:\Users\atefm\Desktop\Projects\terrasens\terrasens\stress-service"
        }
        
        Write-Host "Service path: $stressServicePath" -ForegroundColor Gray
        
        # Start the service in background
        $job = Start-Process -FilePath "cmd.exe" `
            -ArgumentList "/c cd /d `"$stressServicePath`" && npm run dev" `
            -WindowStyle Minimized `
            -PassThru `
            -ErrorAction Stop
        
        Write-Host "✓ Service started (PID: $($job.Id))" -ForegroundColor Green
        
        # Wait for service to be ready
        Write-Host "Waiting for service to be ready..." -ForegroundColor Gray
        $elapsed = 0
        while ($elapsed -lt $timeout) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:$port/health" -ErrorAction SilentlyContinue
                if ($response.StatusCode -eq 200) {
                    Write-Host "✓ Service is ready!" -ForegroundColor Green
                    break
                }
            } catch {
                # Service not ready yet
            }
            Start-Sleep -Seconds 1
            $elapsed++
            Write-Host "." -NoNewline
        }
        Write-Host ""
        
        if ($elapsed -ge $timeout) {
            Write-Host "⚠ Service startup timeout - may still be initializing" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "✗ Error starting service: $_" -ForegroundColor Red
        exit 1
    }
}

# 3. Run validation
Write-Host ""
Write-Host "[3/4] Running validation tests..." -ForegroundColor Yellow
Write-Host ""

$env:STRESS_SERVICE_URL = "http://localhost:$port"
if ($verbose) {
    node validate-stress-output.js --verbose
} else {
    node validate-stress-output.js
}

$validationExitCode = $LASTEXITCODE

# 4. Summary
Write-Host ""
Write-Host "[4/4] Validation complete" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($validationExitCode -eq 0) {
    Write-Host "  ✓ ALL VALIDATIONS PASSED" -ForegroundColor Green
} else {
    Write-Host "  ✗ SOME VALIDATIONS FAILED" -ForegroundColor Red
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

exit $validationExitCode
