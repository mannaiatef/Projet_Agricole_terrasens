#!/bin/bash

# Script to start stress-service and validate it
# This script is designed for Unix-like systems (Linux, macOS)

VERBOSE=false
TIMEOUT=30
PORT=3005
STRESS_SERVICE_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --verbose) VERBOSE=true; shift ;;
    --timeout) TIMEOUT="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

echo "========================================"
echo "  STRESS SERVICE VALIDATION WORKFLOW"
echo "========================================"
echo ""

# 1. Check if stress-service is running
echo -e "\033[33m[1/4] Checking if stress-service is running on port $PORT...\033[0m"
if lsof -i :$PORT > /dev/null 2>&1; then
    echo -e "\033[32m✓ Stress-service is already running\033[0m"
    SERVICE_RUNNING=true
else
    echo -e "\033[31m✗ Stress-service is NOT running\033[0m"
    SERVICE_RUNNING=false
fi

# 2. Start service if not running
if [ "$SERVICE_RUNNING" = false ]; then
    echo ""
    echo -e "\033[33m[2/4] Starting stress-service...\033[0m"
    
    cd "$STRESS_SERVICE_PATH"
    npm run dev > /tmp/stress-service.log 2>&1 &
    SERVICE_PID=$!
    echo -e "\033[32m✓ Service started (PID: $SERVICE_PID)\033[0m"
    
    echo "Waiting for service to be ready..."
    ELAPSED=0
    while [ $ELAPSED -lt $TIMEOUT ]; do
        if curl -s http://localhost:$PORT/health > /dev/null; then
            echo -e "\033[32m✓ Service is ready!\033[0m"
            break
        fi
        sleep 1
        ELAPSED=$((ELAPSED + 1))
        echo -n "."
    done
    echo ""
    
    if [ $ELAPSED -ge $TIMEOUT ]; then
        echo -e "\033[33m⚠ Service startup timeout - may still be initializing\033[0m"
    fi
fi

# 3. Run validation
echo ""
echo -e "\033[33m[3/4] Running validation tests...\033[0m"
echo ""

export STRESS_SERVICE_URL="http://localhost:$PORT"
if [ "$VERBOSE" = true ]; then
    node "$STRESS_SERVICE_PATH/validate-stress-output.js" --verbose
else
    node "$STRESS_SERVICE_PATH/validate-stress-output.js"
fi

VALIDATION_EXIT_CODE=$?

# 4. Summary
echo ""
echo -e "\033[33m[4/4] Validation complete\033[0m"
echo ""
echo "========================================"
if [ $VALIDATION_EXIT_CODE -eq 0 ]; then
    echo -e "\033[32m  ✓ ALL VALIDATIONS PASSED\033[0m"
else
    echo -e "\033[31m  ✗ SOME VALIDATIONS FAILED\033[0m"
fi
echo "========================================"
echo ""

exit $VALIDATION_EXIT_CODE
