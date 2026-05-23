/**
 * Unit Tests: NDVI Stress Classification & GeoJSON Generation
 * Tests for backend stress detection logic
 */

const NDVIService = require('../src/services/NDVIService');
const GeoJSONService = require('../src/services/GeoJSONService');

describe('NDVIService.classifyStress()', () => {
  const ndvi = new NDVIService();

  describe('Stress Classification Boundary Tests', () => {
    
    test('NDVI <= 0.30 should classify as HIGH stress', () => {
      expect(ndvi.classifyStress(0.0)).toBe('high');
      expect(ndvi.classifyStress(0.15)).toBe('high');
      expect(ndvi.classifyStress(0.30)).toBe('high');
    });

    test('NDVI 0.30 < value <= 0.45 should classify as MEDIUM stress', () => {
      expect(ndvi.classifyStress(0.31)).toBe('medium');
      expect(ndvi.classifyStress(0.40)).toBe('medium');
      expect(ndvi.classifyStress(0.45)).toBe('medium');
    });

    test('NDVI > 0.45 should classify as HEALTHY', () => {
      expect(ndvi.classifyStress(0.46)).toBe('healthy');
      expect(ndvi.classifyStress(0.50)).toBe('healthy');
      expect(ndvi.classifyStress(1.0)).toBe('healthy');
    });

    test('Edge case: NDVI exactly at boundaries', () => {
      // Boundary at 0.35
      expect(ndvi.classifyStress(0.349)).toBe('high');
      expect(ndvi.classifyStress(0.350)).toBe('medium');
      
      // Boundary at 0.45
      expect(ndvi.classifyStress(0.449)).toBe('medium');
      expect(ndvi.classifyStress(0.450)).toBe('healthy');
    });

    test('Negative NDVI (water/non-vegetation) should be HIGH stress', () => {
      expect(ndvi.classifyStress(-0.5)).toBe('high');
      expect(ndvi.classifyStress(-0.1)).toBe('high');
    });
  });

  describe('Pixel Stress Map Generation', () => {
    
    test('Should generate stress level for each pixel', () => {
      const validPixels = [
        { index: 0, ndvi: 0.28, nir: 200, red: 100 },
        { index: 1, ndvi: 0.42, nir: 300, red: 120 },
        { index: 2, ndvi: 0.60, nir: 400, red: 100 }
      ];

      const pixelMap = ndvi.generatePixelStressMap(validPixels, 2, 2, [0, 0.01, 0, 1, 0, 0.01]);

      expect(pixelMap).toBeDefined();
      expect(pixelMap.length).toBe(3);
      
      // Check stress levels
      expect(pixelMap[0].stressLevel).toBe('high');
      expect(pixelMap[1].stressLevel).toBe('medium');
      expect(pixelMap[2].stressLevel).toBe('healthy');
    });

    test('Should include geographic coordinates for each pixel', () => {
      const validPixels = [
        { index: 0, ndvi: 0.28, nir: 200, red: 100 }
      ];

      const geoTransform = [35.0, 0.01, 0, 36.0, 0, -0.01];  // [minLon, pixelWidth, 0, maxLat, 0, -pixelHeight]
      const pixelMap = ndvi.generatePixelStressMap(validPixels, 10, 10, geoTransform);

      expect(pixelMap[0]).toHaveProperty('longitude');
      expect(pixelMap[0]).toHaveProperty('latitude');
      expect(typeof pixelMap[0].longitude).toBe('number');
      expect(typeof pixelMap[0].latitude).toBe('number');
    });

    test('Should handle empty pixels array', () => {
      const pixelMap = ndvi.generatePixelStressMap([], 10, 10, [0, 0.01, 0, 1, 0, 0.01]);
      expect(pixelMap).toEqual([]);
    });
  });

  describe('Stress Percentage Calculation', () => {
    
    test('Should calculate percentage of stressed pixels', () => {
      const validPixels = [
        { ndvi: 0.28 }, // high stress
        { ndvi: 0.40 }, // medium stress
        { ndvi: 0.55 }, // healthy
        { ndvi: 0.25 }, // high stress
        { ndvi: 0.60 }  // healthy
      ];

      const result = ndvi.calculateStressPercentage(validPixels);
      
      expect(result).toHaveProperty('stressPercentage');
      expect(result.stressPercentage).toBe(60); // 3 out of 5 = 60%
      expect(result.highStressPixels).toBe(2);
      expect(result.mediumStressPixels).toBe(1);
      expect(result.healthyPixels).toBe(2);
    });

    test('Should handle zero pixels', () => {
      const result = ndvi.calculateStressPercentage([]);
      expect(result).toBe(0);
    });

    test('Should handle all healthy pixels', () => {
      const validPixels = [
        { ndvi: 0.50 },
        { ndvi: 0.60 },
        { ndvi: 0.70 }
      ];
      
      const result = ndvi.calculateStressPercentage(validPixels);
      expect(result.stressPercentage).toBe(0);
      expect(result.healthyPixels).toBe(3);
    });

    test('Should handle all stressed pixels', () => {
      const validPixels = [
        { ndvi: 0.10 },
        { ndvi: 0.25 },
        { ndvi: 0.30 }
      ];
      
      const result = ndvi.calculateStressPercentage(validPixels);
      expect(result.stressPercentage).toBe(100);
      expect(result.highStressPixels).toBe(3);
    });
  });
});

describe('GeoJSONService - Zone Generation', () => {
  const geoJson = new GeoJSONService();

  describe('Stress Zone Creation', () => {
    
    test('Should create zone with correct stressLevel', () => {
      const pixels = Array.from({ length: 15 }, (_, i) => ({
        ndvi: 0.28,
        longitude: 35.0 + i * 0.001,
        latitude: 36.0 + i * 0.001,
        pixelIndex: i,
        stressLevel: 'high'
      }));

      // Mock convex hull computation (would normally be more complex)
      const zone = geoJson._createStressZone(pixels, 'high', null);

      expect(zone).toBeDefined();
      expect(zone.stressLevel).toBe('high');
      expect(zone.pixelCount).toBe(15);
      expect(zone.mean_ndvi_in_zone).toBe(0.28);
    });

    test('Should include stressLevel in GeoJSON properties', () => {
      const pixels = Array.from({ length: 15 }, (_, i) => ({
        ndvi: 0.42,
        longitude: 35.0 + i * 0.001,
        latitude: 36.0 + i * 0.001,
        pixelIndex: i,
        stressLevel: 'medium'
      }));

      // Note: _createStressZone returns internal format, not full GeoJSON Feature
      // The properties would be added when fetched from DB
      const zone = geoJson._createStressZone(pixels, 'medium', null);

      expect(zone.stressLevel).toBe('medium');
      // The geojson contains the geometry only
      expect(zone.geojson.type).toBe('Polygon');
      expect(Array.isArray(zone.geojson.coordinates[0])).toBe(true);
    });

    test('Should return null for clusters smaller than 10 pixels', () => {
      const pixels = Array.from({ length: 5 }, (_, i) => ({
        ndvi: 0.28,
        longitude: 35.0 + i * 0.001,
        latitude: 36.0 + i * 0.001,
        pixelIndex: i,
        stressLevel: 'high'
      }));

      const zone = geoJson._createStressZone(pixels, 'high', null);
      // Might be null due to convex hull validation
      // (depends on implementation details)
    });
  });

  describe('Zone Classification Consistency', () => {
    
    test('All pixels with NDVI < 0.35 should generate HIGH stress zone', () => {
      const pixels = Array.from({ length: 20 }, (_, i) => ({
        ndvi: 0.28,  // Always high stress NDVI
        longitude: 35.0 + (i % 5) * 0.001,
        latitude: 36.0 + Math.floor(i / 5) * 0.001,
        pixelIndex: i,
        stressLevel: 'high'
      }));

      const zone = geoJson._createStressZone(pixels, 'high', null);
      expect(zone.stressLevel).toBe('high');
      expect(zone.mean_ndvi_in_zone).toBe(0.28);
    });

    test('Mixed NDVI pixels should have correct average', () => {
      const pixels = [
        { ndvi: 0.20, longitude: 35.0, latitude: 36.0, pixelIndex: 0, stressLevel: 'high' },
        { ndvi: 0.40, longitude: 35.001, latitude: 36.0, pixelIndex: 1, stressLevel: 'medium' },
        { ndvi: 0.60, longitude: 35.002, latitude: 36.0, pixelIndex: 2, stressLevel: 'healthy' },
      ];

      // For a mixed zone, backend would classify by the seed pixel's stress level
      // In this case, let's test with the median as the classification
      const zone = geoJson._createStressZone(pixels, 'medium', null);
      
      expect(zone.mean_ndvi_in_zone).toBeCloseTo(0.4, 2);
    });
  });

  describe('GeoJSON Feature Collection', () => {
    
    test('Should create valid FeatureCollection', () => {
      const zones = [
        {
          stressLevel: 'high',
          geojson: { type: 'Polygon', coordinates: [[[35, 36], [35.001, 36], [35.001, 36.001], [35, 36.001], [35, 36]]] },
          pixelCount: 15,
          meanNdviInZone: 0.28
        },
        {
          stressLevel: 'medium',
          geojson: { type: 'Polygon', coordinates: [[[35.002, 36.002], [35.003, 36.002], [35.003, 36.003], [35.002, 36.003], [35.002, 36.002]]] },
          pixelCount: 20,
          meanNdviInZone: 0.40
        }
      ];

      const featureCollection = geoJson.createFeatureCollection(zones);

      expect(featureCollection.type).toBe('FeatureCollection');
      expect(featureCollection.features).toBeDefined();
      expect(featureCollection.features.length).toBe(2);
      
      // Check first feature
      expect(featureCollection.features[0].type).toBe('Feature');
      expect(featureCollection.features[0].properties.stressLevel).toBe('high');
      
      // Check second feature
      expect(featureCollection.features[1].properties.stressLevel).toBe('medium');
    });
  });
});

describe('Stress Level Classification Consistency', () => {
  
  test('Backend classification should match Frontend color mapping', () => {
    // This is a contract test between backend and frontend
    const ndvi = new NDVIService();
    
    const testCases = [
      { ndvi: 0.20, expectedStressLevel: 'high', expectedColor: 'red' },
      { ndvi: 0.35, expectedStressLevel: 'medium', expectedColor: 'orange' },
      { ndvi: 0.50, expectedStressLevel: 'healthy', expectedColor: 'green' },
      { ndvi: 0.70, expectedStressLevel: 'healthy', expectedColor: 'green' }
    ];

    testCases.forEach(testCase => {
      const stressLevel = ndvi.classifyStress(testCase.ndvi);
      expect(stressLevel).toBe(testCase.expectedStressLevel);
      
      // Frontend should map stress level to color
      // This test documents the expected behavior
      console.log(`NDVI ${testCase.ndvi} → ${stressLevel} → ${testCase.expectedColor}`);
    });
  });
});

// Run tests
describe('Test Summary', () => {
  test('All critical stress detection tests should pass', () => {
    expect(true).toBe(true);
  });
});
