/**
 * CROP ENGINE UNIT TESTS
 * 
 * Tests the deterministic calendar generation algorithm.
 */

const CropEngine = require('../domain/logic/crop-engine');
const assert = require('assert');

describe('CropEngine', () => {
  describe('generateCalendar', () => {
    it('should generate calendar for Blé with correct algorithm', () => {
      const cropName = 'Blé';
      const sowingDate = '2026-01-15';

      const calendar = CropEngine.generateCalendar(cropName, sowingDate);

      // Verify basic structure
      assert.strictEqual(calendar.crop_name, 'Blé', 'Crop name should be Blé');
      assert.strictEqual(calendar.sowing_date, '2026-01-15', 'Sowing date should match');
      assert.strictEqual(calendar.total_duration_days, 140, 'Total duration should be 140 days');
      assert(calendar.stages.length > 0, 'Should have stages');
    });

    it('should calculate stage 4 correctly (épiaison-floraison)', () => {
      const cropName = 'Blé';
      const sowingDate = '2026-01-15';

      const calendar = CropEngine.generateCalendar(cropName, sowingDate);

      // Find stage 4
      const stage4 = calendar.stages.find((s) => s.number === 4);
      assert(stage4, 'Stage 4 should exist');

      // CRITICAL TEST: Stage 4 dates
      // Expected: 2026-03-26 → 2026-04-14
      assert.strictEqual(
        stage4.start_date,
        '2026-03-26',
        'Stage 4 start date should be 2026-03-26'
      );
      assert.strictEqual(
        stage4.end_date,
        '2026-04-14',
        'Stage 4 end date should be 2026-04-14'
      );

      // Verify stage 4 is 30 days
      assert.strictEqual(
        stage4.duration_days,
        30,
        'Stage 4 (Épiaison-Floraison) should be 30 days'
      );
    });

    it('should have sequential dates with no gaps', () => {
      const calendar = CropEngine.generateCalendar('Blé', '2026-01-15');

      for (let i = 0; i < calendar.stages.length - 1; i++) {
        const currentStage = calendar.stages[i];
        const nextStage = calendar.stages[i + 1];

        // Calculate next day after current stage ends
        const currentEndDate = new Date(currentStage.end_date);
        currentEndDate.setDate(currentEndDate.getDate() + 1);

        const nextStartDate = new Date(nextStage.start_date);

        assert.strictEqual(
          currentEndDate.toISOString().split('T')[0],
          nextStartDate.toISOString().split('T')[0],
          `No gap between stage ${i + 1} and ${i + 2}`
        );
      }
    });

    it('should calculate day_from_sowing correctly', () => {
      const calendar = CropEngine.generateCalendar('Blé', '2026-01-15');

      // Stage 1 should start on day 1
      assert.strictEqual(
        calendar.stages[0].day_from_sowing_start,
        1,
        'Stage 1 should start on day 1 from sowing'
      );

      // Verify stage 2 starts on correct day
      // Stage 1: 20 days, so stage 2 starts on day 21
      assert.strictEqual(
        calendar.stages[1].day_from_sowing_start,
        21,
        'Stage 2 should start on day 21 from sowing (day 1 + 20 days)'
      );
    });

    it('should include fertilization data', () => {
      const calendar = CropEngine.generateCalendar('Blé', '2026-01-15');

      // Stage 1 should have fertilization
      const stage1 = calendar.stages[0];
      assert(stage1.fertilization, 'Stage 1 should have fertilization');
      assert.strictEqual(
        stage1.fertilization.type,
        'base',
        'Stage 1 fertilization should be base'
      );
      assert(stage1.fertilization.npk, 'Fertilization should have NPK values');
    });

    it('should include actions for stages', () => {
      const calendar = CropEngine.generateCalendar('Blé', '2026-01-15');

      // Stages should have actions array
      for (const stage of calendar.stages) {
        assert(Array.isArray(stage.actions), `Stage ${stage.number} should have actions array`);
      }
    });

    it('should include alerts for stages', () => {
      const calendar = CropEngine.generateCalendar('Blé', '2026-01-15');

      // Some stages should have alerts
      const stageWithAlerts = calendar.stages.find((s) => s.alerts && s.alerts.length > 0);
      assert(stageWithAlerts, 'At least one stage should have alerts');
    });

    it('should throw error for invalid crop name', () => {
      assert.throws(
        () => CropEngine.generateCalendar('InvalidCrop', '2026-01-15'),
        (err) => err.message.includes('not found'),
        'Should throw error for unknown crop'
      );
    });

    it('should throw error for invalid date format', () => {
      assert.throws(
        () => CropEngine.generateCalendar('Blé', '01-15-2026'),
        (err) => err.message.includes('Invalid'),
        'Should reject invalid date format'
      );
    });

    it('should be case-insensitive for crop name', () => {
      const calendar1 = CropEngine.generateCalendar('Blé', '2026-01-15');
      const calendar2 = CropEngine.generateCalendar('blé', '2026-01-15');

      assert.strictEqual(
        calendar1.total_duration_days,
        calendar2.total_duration_days,
        'Case-insensitive match should work'
      );
    });
  });

  describe('getCurrentStage', () => {
    it('should find current stage', () => {
      const calendar = CropEngine.generateCalendar('Blé', '2026-01-15');
      const currentDate = '2026-01-20'; // During stage 1

      const currentStage = CropEngine.getCurrentStage(calendar, currentDate);

      assert(currentStage, 'Should find a stage');
      assert.strictEqual(currentStage.number, 1, 'Should be stage 1');
    });

    it('should return null if no stage matches', () => {
      const calendar = { stages: [] };
      const currentDate = '2026-01-20';

      const currentStage = CropEngine.getCurrentStage(calendar, currentDate);

      assert.strictEqual(currentStage, null, 'Should return null for empty calendar');
    });
  });

  describe('validateCalendar', () => {
    it('should validate correct calendar', () => {
      const calendar = CropEngine.generateCalendar('Blé', '2026-01-15');

      const errors = CropEngine.validateCalendar(calendar);

      assert.strictEqual(errors.length, 0, 'Valid calendar should have no errors');
    });

    it('should detect total duration mismatch', () => {
      const calendar = CropEngine.generateCalendar('Blé', '2026-01-15');
      calendar.total_duration_days = 999; // Incorrect

      const errors = CropEngine.validateCalendar(calendar);

      assert(errors.some((e) => e.includes('mismatch')), 'Should detect duration mismatch');
    });
  });

  describe('getAvailableCrops', () => {
    it('should return list of crops', () => {
      const crops = CropEngine.getAvailableCrops();

      assert(Array.isArray(crops), 'Should return an array');
      assert(crops.length > 0, 'Should have at least one crop');
      assert(crops.some((c) => c.name === 'Blé'), 'Should include Blé');
    });

    it('should include crop metadata', () => {
      const crops = CropEngine.getAvailableCrops();
      const ble = crops.find((c) => c.name === 'Blé');

      assert(ble.duration_days, 'Should have duration_days');
      assert(ble.stage_count, 'Should have stage_count');
      assert(ble.planting_window, 'Should have planting_window');
    });
  });

  describe('getCropDetails', () => {
    it('should return full crop details', () => {
      const details = CropEngine.getCropDetails('Blé');

      assert.strictEqual(details.name, 'Blé', 'Should have correct name');
      assert(details.stages, 'Should have stages');
      assert(details.stages.length > 0, 'Should have stage data');
    });

    it('should include stage details', () => {
      const details = CropEngine.getCropDetails('Blé');
      const stage1 = details.stages[0];

      assert(stage1.name, 'Stage should have name');
      assert(stage1.duration_days, 'Stage should have duration');
      assert(stage1.kc_value, 'Stage should have kc_value');
    });
  });
});

// Run tests if executed directly
if (require.main === module) {
  console.log('Running CropEngine Tests...');
  
  // Simple test runner
  const tests = [
    {
      name: 'Blé calendar for 2026-01-15',
      fn: () => {
        const calendar = CropEngine.generateCalendar('Blé', '2026-01-15');
        console.log('✓ Calendar generated');
        console.log(`  Total duration: ${calendar.total_duration_days} days`);
        console.log(`  Stages: ${calendar.stages.length}`);
        
        const stage4 = calendar.stages.find((s) => s.number === 4);
        console.log(`  Stage 4: ${stage4.start_date} → ${stage4.end_date}`);
        
        if (
          calendar.total_duration_days === 140 &&
          stage4.start_date === '2026-03-26' &&
          stage4.end_date === '2026-04-14'
        ) {
          console.log('✓ CRITICAL TEST PASSED');
        } else {
          console.log('✗ CRITICAL TEST FAILED');
          throw new Error('Calendar calculation incorrect');
        }
      },
    },
  ];

  for (const test of tests) {
    try {
      console.log(`\nTest: ${test.name}`);
      test.fn();
    } catch (error) {
      console.error(`✗ Test failed: ${error.message}`);
      process.exit(1);
    }
  }

  console.log('\n✓ All tests passed!');
}

module.exports = { CropEngine };
