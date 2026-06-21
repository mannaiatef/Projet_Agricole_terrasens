@echo off
REM Script to start stress-service and validate it
REM This script is designed for Windows Command Prompt

setlocal enabledelayedexpansion

set VERBOSE=false
set TIMEOUT=30
set PORT=3005

REM Parse arguments
:parse_args
if "%1"=="" goto start_check
if "%1"=="--verbose" (set VERBOSE=true) & shift & goto parse_args
if "%1"=="--timeout" (set TIMEOUT=%2) & shift & shift & goto parse_args
if "%1"=="--port" (set PORT=%2) & shift & shift & goto parse_args

:start_check
echo.
echo ========================================
echo   STRESS SERVICE VALIDATION WORKFLOW
echo ========================================
echo.

REM 1. Check if stress-service is running
echo [1/4] Checking if stress-service is running on port %PORT%...

netstat -an | findstr /R ":%PORT% " >nul
if %errorlevel% equ 0 (
    echo.
    echo [Success] Stress-service is already running on port %PORT%
    goto run_validation
) else (
    echo.
    echo [Warning] Stress-service does NOT appear to be running on port %PORT%
    echo.
    echo To start the service manually, run:
    echo   npm run dev
    echo.
    echo Then retry the validation with:
    echo   npm run validate
    echo.
    exit /b 1
)

:run_validation
REM 3. Run validation
echo.
echo [3/4] Running validation tests...
echo.

set STRESS_SERVICE_URL=http://localhost:%PORT%

if "%VERBOSE%"=="true" (
    node validate-stress-output.js --verbose
) else (
    node validate-stress-output.js
)

set VALIDATION_EXIT_CODE=%errorlevel%

REM 4. Summary
echo.
echo [4/4] Validation complete
echo.
echo ========================================

if %VALIDATION_EXIT_CODE% equ 0 (
    echo   SUCCESS - All validations passed
) else (
    echo   FAILURE - Some validations failed
)

echo ========================================
echo.

exit /b %VALIDATION_EXIT_CODE%
