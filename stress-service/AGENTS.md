---
title: Stress Service Validation Agent
category: Testing & Quality Assurance
description: Automated validation agent that verifies if the stress-service returns correct and consistent values
tags: [validation, stress-service, testing, ndvi, quality-assurance]
---

# 🔍 Stress Service Validation Agent

## Overview

The **Stress Service Validation Agent** is a specialized automated testing tool that validates the correctness and consistency of values returned by the `stress-service` microservice in the TerraSens project.

## Purpose

This agent ensures data quality by automatically checking:
- API response format and structure
- NDVI calculations accuracy
- Stress classification logic
- GeoJSON zone validity
- Alert generation rules
- Temporal data consistency

## Capabilities

### ✅ What it validates

| Category | Validations |
|----------|-------------|
| **API Format** | JSON structure, HTTP status codes, required fields |
| **NDVI Calculations** | Value range [-1,1], formula correctness, statistics |
| **Stress Classification** | Correct class assignment (high/medium/healthy) |
| **Geographic Data** | GeoJSON validity, polygon closure, coordinate bounds |
| **Alerts** | Severity level logic, alert generation rules |
| **Timestamps** | ISO 8601 format, date validity, consistency |

### 🎯 Coverage

- **Endpoints**: 9 REST endpoints
- **Test Cases**: 50+ automated checks
- **Parcel Tests**: Configurable (default: 5 parcels)
- **Execution Time**: ~10-30 seconds

## Getting Started

### Quick Start

```bash
cd stress-service

# Run validation with default configuration
node validate-stress-output.js

# Run with verbose output
node validate-stress-output.js --verbose
```

### Configuration

Edit [.env.validation](.env.validation) to customize:

```bash
# Service URLs
STRESS_SERVICE_URL=http://localhost:3004
CROP_CALENDAR_SERVICE_URL=http://localhost:3002

# Test parameters
TEST_PARCEL_IDS=1,2,3,4,5
NDVI_PRECISION_DECIMALS=4
API_TIMEOUT=30000
```

### Example with Environment Variables

```bash
# Test specific parcels
TEST_PARCEL_IDS=10,20,30 node validate-stress-output.js

# Connect to remote service
STRESS_SERVICE_URL=http://prod.example.com:3004 node validate-stress-output.js

# Increase timeout for slow networks
API_TIMEOUT=60000 node validate-stress-output.js
```

## Output & Interpretation

### Success Output

```
========== VALIDATION SUMMARY ==========
Total Checks: 145
Passed: 145
Failed: 0
Pass Rate: 100.00%
Warnings: 0
Errors: 0
```

### With Errors

```
========== VALIDATION SUMMARY ==========
Total Checks: 145
Passed: 142
Failed: 3
Pass Rate: 97.93%
Warnings: 2
Errors: 1
```

Errors are detailed in the JSON report for debugging.

## Key Validation Rules

### NDVI Classification

```javascript
ndvi > 0.45    → 'healthy'   (low stress)
0.35 < ndvi ≤ 0.45 → 'medium' (moderate stress)
ndvi ≤ 0.35    → 'high'      (high stress)
```

### Stress Percentage Accuracy

```
Calculation: (stressed_pixels / total_pixels) × 100
Tolerance: ±0.01%
Range: [0, 100]
```

### Alert Severity Rules

```
stress > 45%   → severity must be 'high'
30% < stress ≤ 45% → severity should be 'medium'
stress ≤ 15%   → few/no alerts expected
```

### GeoJSON Requirements

```
Type: FeatureCollection with Polygon geometries
Closure: First point === Last point
Points: Minimum 4 (3 unique + closure)
Coordinates: Valid lat/lon bounds [-90,90] / [-180,180]
```

## Files

- **[VALIDATION_AGENT.md](VALIDATION_AGENT.md)** - Detailed technical specification
- **[VALIDATION_AGENT_GUIDE.md](VALIDATION_AGENT_GUIDE.md)** - Complete user guide
- **[validate-stress-output.js](validate-stress-output.js)** - Main validation script
- **[.env.validation](.env.validation)** - Configuration file
- **tests/validation-reports/** - Generated reports (JSON, logs)

## Common Issues & Solutions

### Connection Refused
```bash
# Ensure service is running
docker ps | grep stress-service
npm run dev  # Start service
```

### Timeout Errors
```bash
# Increase timeout for slow networks
API_TIMEOUT=60000 node validate-stress-output.js
```

### NDVI Precision Issues
```bash
# Increase decimal precision if needed
NDVI_PRECISION_DECIMALS=5 node validate-stress-output.js
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Validate Stress Service

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd stress-service && npm install
      - run: npm run dev &
      - run: sleep 5 && node validate-stress-output.js
```

### Pre-deployment Checklist

```bash
#!/bin/bash
# Check service health
curl -f http://localhost:3004/health || exit 1

# Run validation
node stress-service/validate-stress-output.js || exit 1

# Verify pass rate >= 98%
PASS_RATE=$(cat stress-service/tests/validation-reports/latest-validation.json | jq '.summary.pass_rate')
if (( $(echo "$PASS_RATE < 98" | bc -l) )); then
  echo "❌ Pass rate below 98%"
  exit 1
fi

echo "✅ All validations passed - ready for deployment"
```

## Advanced Usage

### Custom Validation Rules

Extend `validate-stress-output.js` to add custom rules:

```javascript
function validateCustomRule(data) {
  const checks = [];
  
  // Add your custom validation logic
  checks.push({
    name: 'Custom rule name',
    passed: true/false,
    details: 'Explanation'
  });
  
  return checks;
}
```

### Generate HTML Reports

```bash
# Extract JSON and convert to HTML
node -e "
  const report = require('./tests/validation-reports/latest-validation.json');
  console.log('<html><body><pre>' + JSON.stringify(report, null, 2) + '</pre></body></html>')
" > report.html
```

## Performance Metrics

| Metric | Target | Acceptable |
|--------|--------|-----------|
| Pass Rate | 100% | ≥ 98% |
| Execution Time | < 10s | < 30s |
| API Response | < 200ms | < 1s |
| Memory Usage | < 50MB | < 100MB |

## Support & Documentation

- **Full Guide**: [VALIDATION_AGENT_GUIDE.md](VALIDATION_AGENT_GUIDE.md)
- **Technical Spec**: [VALIDATION_AGENT.md](VALIDATION_AGENT.md)
- **Issues**: Check generated reports in `tests/validation-reports/`

---

**Version**: 1.0.0  
**Last Updated**: 2024-01-15  
**Compatibility**: Node.js 14+, stress-service v2.0+
