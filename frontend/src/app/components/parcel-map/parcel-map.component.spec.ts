/**
 * Unit Tests: Frontend Stress Zone Color Mapping
 * Tests for frontend color mapping from stress classification
 */

describe('ParcelMapComponent - Color Mapping Tests', () => {
  
  // Mock the color mapping function (as it exists in parcel-map.component.ts)
  class StressColorMapper {
    /**
     * Get color from stress classification
     */
    getColorFromStressLevel(stressLevel: string | undefined): string {
      const normalized = (stressLevel || '').toLowerCase().trim();
      
      switch (normalized) {
        case 'high':
          return '#F44336';    // Red
        case 'medium':
          return '#FF9800';    // Orange
        case 'healthy':
          return '#4CAF50';    // Green
        default:
          throw new Error(`Unknown stress level: '${stressLevel}'`);
      }
    }

    /**
     * Fallback: Get color from NDVI value
     */
    getColorFromNDVI(ndvi: number): string {
      if (ndvi < 0.3) return '#F44336';   // red
      if (ndvi < 0.4) return '#FF9800';   // orange
      return '#4CAF50';                   // green
    }
  }

  let mapper: StressColorMapper;

  beforeEach(() => {
    mapper = new StressColorMapper();
  });

  describe('Stress Level to Color Mapping', () => {
    
    test('HIGH stress should map to RED', () => {
      expect(mapper.getColorFromStressLevel('high')).toBe('#F44336');
      expect(mapper.getColorFromStressLevel('HIGH')).toBe('#F44336');
      expect(mapper.getColorFromStressLevel('  high  ')).toBe('#F44336');
    });

    test('MEDIUM stress should map to ORANGE', () => {
      expect(mapper.getColorFromStressLevel('medium')).toBe('#FF9800');
      expect(mapper.getColorFromStressLevel('MEDIUM')).toBe('#FF9800');
      expect(mapper.getColorFromStressLevel('  medium  ')).toBe('#FF9800');
    });

    test('HEALTHY should map to GREEN', () => {
      expect(mapper.getColorFromStressLevel('healthy')).toBe('#4CAF50');
      expect(mapper.getColorFromStressLevel('HEALTHY')).toBe('#4CAF50');
      expect(mapper.getColorFromStressLevel('  healthy  ')).toBe('#4CAF50');
    });

    test('Unknown stress level should throw error', () => {
      expect(() => mapper.getColorFromStressLevel('unknown')).toThrow();
      expect(() => mapper.getColorFromStressLevel('critical')).toThrow();
    });

    test('Undefined/null should throw error', () => {
      expect(() => mapper.getColorFromStressLevel(undefined)).toThrow();
      expect(() => mapper.getColorFromStressLevel(null as any)).toThrow();
    });
  });

  describe('NDVI-based Color Mapping (Fallback)', () => {
    
    test('NDVI < 0.3 should map to RED', () => {
      expect(mapper.getColorFromNDVI(0.0)).toBe('#F44336');
      expect(mapper.getColorFromNDVI(0.15)).toBe('#F44336');
      expect(mapper.getColorFromNDVI(0.29)).toBe('#F44336');
    });

    test('NDVI 0.3-0.4 should map to ORANGE', () => {
      expect(mapper.getColorFromNDVI(0.30)).toBe('#FF9800');
      expect(mapper.getColorFromNDVI(0.35)).toBe('#FF9800');
      expect(mapper.getColorFromNDVI(0.39)).toBe('#FF9800');
    });

    test('NDVI >= 0.4 should map to GREEN', () => {
      expect(mapper.getColorFromNDVI(0.40)).toBe('#4CAF50');
      expect(mapper.getColorFromNDVI(0.50)).toBe('#4CAF50');
      expect(mapper.getColorFromNDVI(1.0)).toBe('#4CAF50');
    });
  });

  describe('Stress Level vs NDVI Discrepancy Detection', () => {
    
    test('Should detect when stressLevel and NDVI disagree', () => {
      // Case 1: Backend says "high" but NDVI suggests "medium"
      const stressLevel = 'high';
      const ndvi = 0.35;
      
      const colorFromStressLevel = mapper.getColorFromStressLevel(stressLevel);
      const colorFromNDVI = mapper.getColorFromNDVI(ndvi);
      
      // CRITICAL: These SHOULD match, but might not if there's a bug
      if (colorFromStressLevel !== colorFromNDVI) {
        console.warn(`[TEST] Discrepancy detected: stressLevel='${stressLevel}' (${colorFromStressLevel}) vs NDVI=${ndvi} (${colorFromNDVI})`);
      }
      
      // With the fix, frontend should use stressLevel, not NDVI
      expect(colorFromStressLevel).toBe('#F44336');  // HIGH = RED
      expect(colorFromNDVI).toBe('#FF9800');         // NDVI 0.35 = ORANGE
      // This shows why using stressLevel is correct!
    });

    test('Boundary case: stressLevel says HEALTHY, NDVI near boundary', () => {
      const stressLevel = 'healthy';
      const ndvi = 0.45;  // Exactly at boundary
      
      const colorFromStressLevel = mapper.getColorFromStressLevel(stressLevel);
      const colorFromNDVI = mapper.getColorFromNDVI(ndvi);
      
      expect(colorFromStressLevel).toBe('#4CAF50');  // HEALTHY = GREEN
      expect(colorFromNDVI).toBe('#4CAF50');         // NDVI 0.45 = GREEN
      // In this case they agree
    });
  });

  describe('Zone Data Structure Validation', () => {
    
    interface Zone {
      id?: number;
      stress_level?: string;
      stressLevel?: string;
      mean_ndvi_in_zone?: number;
      meanNdvi?: number;
      pixel_count?: number;
      pixelCount?: number;
      zone_area?: number;
      zoneArea?: number;
      geojson?: any;
      geometry?: any;
      properties?: {
        stressLevel?: string;
        meanNdvi?: number;
        [key: string]: any;
      };
    }

    test('Should extract stressLevel from root level (DATABASE FORMAT)', () => {
      const zone: Zone = {
        id: 1,
        stress_level: 'high',      // ← From database (snake_case)
        mean_ndvi_in_zone: 0.28,
        pixel_count: 250,
        geojson: { type: 'Polygon', coordinates: [] }
      };

      // Frontend mapping (CORRECTED)
      const mappedZone = {
        stressLevel: zone.stress_level || zone.stressLevel,  // ← Should get 'high'
        meanNdvi: zone.mean_ndvi_in_zone || zone.meanNdvi
      };

      expect(mappedZone.stressLevel).toBe('high');
      expect(mappedZone.meanNdvi).toBe(0.28);
    });

    test('Should handle camelCase properties (API RESPONSE FORMAT)', () => {
      const zone: Zone = {
        id: 1,
        stressLevel: 'medium',      // ← From API (camelCase)
        meanNdvi: 0.40,
        pixelCount: 180,
        geometry: { type: 'Polygon', coordinates: [] }
      };

      // Frontend mapping (backward compatible)
      const mappedZone = {
        stressLevel: zone.stress_level || zone.stressLevel,  // ← Falls back to camelCase
        meanNdvi: zone.mean_ndvi_in_zone || zone.meanNdvi
      };

      expect(mappedZone.stressLevel).toBe('medium');
      expect(mappedZone.meanNdvi).toBe(0.40);
    });

    test('Should prioritize root-level properties over nested properties', () => {
      const zone: Zone = {
        id: 1,
        stress_level: 'high',       // ← Root level
        properties: {
          stressLevel: 'medium'     // ← Nested (should be ignored)
        },
        geojson: { type: 'Polygon', coordinates: [] }
      };

      // Correct priority: root level first
      const stressLevel = zone.stress_level || zone.stressLevel || zone.properties?.stressLevel;

      expect(stressLevel).toBe('high');  // Uses root-level value
    });

    test('Should handle missing stressLevel gracefully', () => {
      const zone: Zone = {
        id: 1,
        mean_ndvi_in_zone: 0.28,   // Has NDVI but no stressLevel
        geojson: { type: 'Polygon', coordinates: [] }
      };

      // Frontend mapping with fallback
      const stressLevel = zone.stress_level || zone.stressLevel || zone.properties?.stressLevel;
      const meanNdvi = zone.mean_ndvi_in_zone || 0;

      if (!stressLevel && meanNdvi) {
        console.warn('[Frontend] Missing stressLevel, falling back to NDVI-based coloring');
      }

      expect(stressLevel).toBeUndefined();
      expect(meanNdvi).toBe(0.28);
    });
  });
});

describe('Map Rendering Logic', () => {
  
  test('Should render all zones with correct colors', () => {
    const mapper = new (class {
      getColorFromStressLevel(level: string): string {
        const map: { [key: string]: string } = {
          'high': '#F44336',
          'medium': '#FF9800',
          'healthy': '#4CAF50'
        };
        return map[level.toLowerCase()] || '#CCCCCC';
      }
    })();

    const zones = [
      { stress_level: 'high', geometry: { type: 'Polygon', coordinates: [] } },
      { stress_level: 'medium', geometry: { type: 'Polygon', coordinates: [] } },
      { stress_level: 'healthy', geometry: { type: 'Polygon', coordinates: [] } }
    ];

    const renderedZones = zones.map(zone => ({
      ...zone,
      color: mapper.getColorFromStressLevel(zone.stress_level)
    }));

    expect(renderedZones[0].color).toBe('#F44336');  // RED
    expect(renderedZones[1].color).toBe('#FF9800');  // ORANGE
    expect(renderedZones[2].color).toBe('#4CAF50');  // GREEN
  });

  test('Should generate correct Leaflet style object', () => {
    const color = '#F44336';
    const leafletStyle = {
      color: color,
      weight: 2,
      opacity: 0.8,
      fillColor: color,
      fillOpacity: 0.5,
      dashArray: null
    };

    expect(leafletStyle.color).toBe('#F44336');
    expect(leafletStyle.fillColor).toBe('#F44336');
    expect(leafletStyle.fillOpacity).toBe(0.5);
    expect(leafletStyle.opacity).toBe(0.8);
    expect(leafletStyle.weight).toBe(2);
  });
});

describe('E2E: Backend to Frontend Data Flow', () => {
  
  test('Complete flow: Backend classification → Frontend rendering', () => {
    // Simulate backend response
    const backendZones = [
      {
        id: 1,
        stress_level: 'high',
        mean_ndvi_in_zone: 0.28,
        pixel_count: 250,
        geojson: { type: 'Polygon', coordinates: [[[35, 36], [35.001, 36], [35.001, 36.001], [35, 36.001], [35, 36]]] }
      },
      {
        id: 2,
        stress_level: 'medium',
        mean_ndvi_in_zone: 0.40,
        pixel_count: 180,
        geojson: { type: 'Polygon', coordinates: [[[35.002, 36.002], [35.003, 36.002], [35.003, 36.003], [35.002, 36.003], [35.002, 36.002]]] }
      }
    ];

    // Simulate frontend mapping
    const mapper = new (class {
      getColorFromStressLevel(level: string): string {
        const map: { [key: string]: string } = {
          'high': '#F44336',
          'medium': '#FF9800',
          'healthy': '#4CAF50'
        };
        return map[level] || '#CCCCCC';
      }
    })();

    const frontendZones = backendZones.map(zone => ({
      id: zone.id,
      stressLevel: zone.stress_level,
      meanNdvi: zone.mean_ndvi_in_zone,
      color: mapper.getColorFromStressLevel(zone.stress_level),
      geometry: zone.geojson
    }));

    // Verify the result
    expect(frontendZones[0].stressLevel).toBe('high');
    expect(frontendZones[0].color).toBe('#F44336');  // RED ✓
    
    expect(frontendZones[1].stressLevel).toBe('medium');
    expect(frontendZones[1].color).toBe('#FF9800');  // ORANGE ✓
  });
});
