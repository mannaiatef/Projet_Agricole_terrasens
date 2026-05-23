const mysql = require('mysql2/promise');
require('dotenv').config();

const seedData = {
  crops: [
    {
      name: 'Wheat',
      duration_days: 150,
      stages: [
        {
          name: 'Germination',
          stage_order: 1,
          duration_days: 10,
          kc_value: 0.3,
          actions: [
            {
              type: 'irrigation',
              title: 'Initial Watering',
              description: 'Ensure soil moisture is 60-70% of field capacity',
              how_to: 'Irrigate gently to avoid seed displacement. Apply 25-30 mm of water.',
              frequency: 'once',
              priority: 'high',
              alert_message: 'Seed germination requires adequate moisture',
            },
            {
              type: 'monitoring',
              title: 'Monitor Germination',
              description: 'Check daily for seedling emergence',
              how_to: 'Observe soil surface for first sprouts',
              frequency: 'daily',
              priority: 'high',
              alert_message: 'Monitor germination progress',
            },
          ],
        },
        {
          name: 'Tillering',
          stage_order: 2,
          duration_days: 30,
          kc_value: 0.4,
          actions: [
            {
              type: 'irrigation',
              title: 'Regular Watering',
              description: 'Maintain soil moisture during active growth',
              how_to: 'Apply 20-25 mm water per week based on rainfall',
              frequency: 'weekly',
              priority: 'high',
              alert_message: 'Proper irrigation supports tiller development',
            },
            {
              type: 'fertilization',
              title: 'Nitrogen Application',
              description: 'Apply nitrogen for tiller formation',
              how_to: 'Apply 40-50 kg/ha of nitrogen as urea',
              frequency: 'once',
              priority: 'high',
              alert_message: 'Nitrogen promotes tillering',
            },
            {
              type: 'treatment',
              title: 'Weed Control',
              description: 'Remove weeds competing with seedlings',
              how_to: 'Manual weeding or herbicide application 3-4 weeks after sowing',
              frequency: 'weekly',
              priority: 'medium',
              alert_message: 'Control weeds early for better crop establishment',
            },
          ],
        },
        {
          name: 'Stem Elongation',
          stage_order: 3,
          duration_days: 35,
          kc_value: 0.8,
          actions: [
            {
              type: 'irrigation',
              title: 'Booting Stage Irrigation',
              description: 'Critical irrigation during boot development',
              how_to: 'Apply 30-35 mm water to provide adequate moisture',
              frequency: 'every-3-4-days',
              priority: 'high',
              alert_message: 'Booting stage requires critical water supply',
            },
            {
              type: 'fertilization',
              title: 'Second Nitrogen Application',
              description: 'Apply second split of nitrogen',
              how_to: 'Apply 30-40 kg/ha of nitrogen as urea',
              frequency: 'once',
              priority: 'medium',
              alert_message: 'Apply timely nitrogen for grain filling',
            },
            {
              type: 'monitoring',
              title: 'Disease Monitoring',
              description: 'Watch for Septoria and other fungal diseases',
              how_to: 'Inspect lower leaves for spots, apply fungicide if needed',
              frequency: 'weekly',
              priority: 'medium',
              alert_message: 'Monitor and control fungal diseases',
            },
          ],
        },
        {
          name: 'Flowering/Anthesis',
          stage_order: 4,
          duration_days: 15,
          kc_value: 1.0,
          actions: [
            {
              type: 'irrigation',
              title: 'Critical Flowering Irrigation',
              description: 'Most critical irrigation period',
              how_to: 'Ensure adequate water availability daily',
              frequency: 'daily',
              priority: 'high',
              alert_message: 'Maintain optimal moisture during flowering',
            },
            {
              type: 'monitoring',
              title: 'Pest Monitoring',
              description: 'Monitor for armyworms and other pests',
              how_to: 'Check crops 2-3 times weekly, apply pesticide if threshold exceeded',
              frequency: 'every-2-3-days',
              priority: 'high',
              alert_message: 'Pests can damage developing grains',
            },
          ],
        },
        {
          name: 'Grain Filling',
          stage_order: 5,
          duration_days: 40,
          kc_value: 0.9,
          actions: [
            {
              type: 'irrigation',
              title: 'Post-Flowering Irrigation',
              description: 'Support grain development',
              how_to: 'Apply 25-30 mm water per week',
              frequency: 'weekly',
              priority: 'high',
              alert_message: 'Adequate water ensures proper grain development',
            },
            {
              type: 'monitoring',
              title: 'Moisture Monitoring',
              description: 'Monitor crop maturity',
              how_to: 'Check grain moisture, begin harvest when moisture is 12-14%',
              frequency: 'weekly',
              priority: 'medium',
              alert_message: 'Monitor grain moisture for optimal harvest timing',
            },
          ],
        },
        {
          name: 'Maturity',
          stage_order: 6,
          duration_days: 20,
          kc_value: 0.2,
          actions: [
            {
              type: 'harvesting',
              title: 'Harvest Preparation',
              description: 'Prepare for harvest',
              how_to: 'Ensure combine harvester is ready, check field conditions',
              frequency: 'once',
              priority: 'high',
              alert_message: 'Begin harvest when grain is fully mature (12-14% moisture)',
            },
            {
              type: 'monitoring',
              title: 'Final Inspection',
              description: 'Final crop assessment',
              how_to: 'Visual inspection for crop readiness',
              frequency: 'every-3-4-days',
              priority: 'medium',
              alert_message: 'Monitor weather for optimal harvest timing',
            },
          ],
        },
      ],
    },
    {
      name: 'Maize',
      duration_days: 140,
      stages: [
        {
          name: 'Germination & Emergence',
          stage_order: 1,
          duration_days: 12,
          kc_value: 0.3,
          actions: [
            {
              type: 'irrigation',
              title: 'Pre-Sowing Irrigation',
              description: 'Prepare field moisture for germination',
              how_to: 'Ensure soil moisture reaches 70% of field capacity',
              frequency: 'once',
              priority: 'high',
              alert_message: 'Proper soil moisture ensures good germination',
            },
            {
              type: 'monitoring',
              title: 'Seedling Emergence Monitoring',
              description: 'Track emergence progress',
              how_to: 'Monitor soil surface daily for first shoots',
              frequency: 'daily',
              priority: 'high',
              alert_message: 'Emergence expected 7-10 days after planting',
            },
          ],
        },
        {
          name: 'Seedling & Vegetative Growth',
          stage_order: 2,
          duration_days: 25,
          kc_value: 0.5,
          actions: [
            {
              type: 'irrigation',
              title: 'Regular Watering (V3-V6)',
              description: 'Maintain soil moisture during early growth',
              how_to: 'Apply 20 mm water twice weekly based on rainfall',
              frequency: 'twice-weekly',
              priority: 'high',
              alert_message: 'Regular irrigation supports root establishment',
            },
            {
              type: 'fertilization',
              title: 'Starter Fertilizer Application',
              description: 'Apply phosphorus and potassium',
              how_to: 'Apply 100-150 kg/ha of NPK fertilizer (15:15:15)',
              frequency: 'once',
              priority: 'high',
              alert_message: 'Early nutrition is critical for root development',
            },
            {
              type: 'treatment',
              title: 'Weed Control',
              description: 'Remove competing weeds',
              how_to: 'Manual weeding or post-emergent herbicide at V3-V4 stage',
              frequency: 'once-twice',
              priority: 'high',
              alert_message: 'Control weeds early to prevent yield loss',
            },
          ],
        },
        {
          name: 'Mid-Season Growth',
          stage_order: 3,
          duration_days: 35,
          kc_value: 0.8,
          actions: [
            {
              type: 'irrigation',
              title: 'Development Stage Watering',
              description: 'Support leaf and root development',
              how_to: 'Apply 25-30 mm water per week',
              frequency: 'weekly',
              priority: 'high',
              alert_message: 'Encourage deep root penetration',
            },
            {
              type: 'fertilization',
              title: 'Main Nitrogen Application',
              description: 'Apply nitrogen at V8-V10 or V12 stage',
              how_to: 'Side-dress 100-150 kg/ha of nitrogen (urea)',
              frequency: 'once',
              priority: 'high',
              alert_message: 'Main nitrogen promotes leaf area and grain sites',
            },
            {
              type: 'monitoring',
              title: 'Pest & Disease Monitoring',
              description: 'Monitor for fall armyworm and leaf diseases',
              how_to: 'Scout plants 2-3 times weekly, apply treatment if needed',
              frequency: 'every-2-3-days',
              priority: 'medium',
              alert_message: 'Early pest control prevents crop damage',
            },
          ],
        },
        {
          name: 'Tassel & Pollination',
          stage_order: 4,
          duration_days: 20,
          kc_value: 1.0,
          actions: [
            {
              type: 'irrigation',
              title: 'Critical Pollination Watering',
              description: 'Ensure optimal soil moisture for pollen viability',
              how_to: 'Provide adequate water daily during tasseling',
              frequency: 'daily',
              priority: 'high',
              alert_message: 'Water stress during pollination severely reduces yield',
            },
            {
              type: 'monitoring',
              title: 'Pollination Success Monitoring',
              description: 'Check for silking and kernel set',
              how_to: 'Observe silk emergence and pollen shedding, listen for sound',
              frequency: 'daily',
              priority: 'high',
              alert_message: 'Monitor successful pollination and kernel set',
            },
          ],
        },
        {
          name: 'Grain Development',
          stage_order: 5,
          duration_days: 35,
          kc_value: 0.85,
          actions: [
            {
              type: 'irrigation',
              title: 'Mid-to-Late Season Watering',
              description: 'Support grain filling',
              how_to: 'Apply 25 mm water every 7-10 days',
              frequency: 'every-7-10-days',
              priority: 'high',
              alert_message: 'Maintain moisture for proper grain filling',
            },
            {
              type: 'monitoring',
              title: 'Grain Filling Progress',
              description: 'Monitor kernel development',
              how_to: 'Check grain moisture and development stage',
              frequency: 'weekly',
              priority: 'medium',
              alert_message: 'Track grain maturation for harvest planning',
            },
          ],
        },
        {
          name: 'Maturity & Harvest',
          stage_order: 6,
          duration_days: 13,
          kc_value: 0.2,
          actions: [
            {
              type: 'harvesting',
              title: 'Harvest Readiness Check',
              description: 'Monitor for physiological maturity',
              how_to: 'Check for black layer formation and grain moisture (15-20%)',
              frequency: 'every-3-4-days',
              priority: 'high',
              alert_message: 'Begin harvest at physiological maturity',
            },
            {
              type: 'harvesting',
              title: 'Harvest Operations',
              description: 'Conduct mechanical harvesting',
              how_to: 'Use combine harvester at grain moisture of 15-20%',
              frequency: 'once',
              priority: 'high',
              alert_message: 'Harvest at optimal moisture to minimize losses',
            },
          ],
        },
      ],
    },
    {
      name: 'Tomato',
      duration_days: 120,
      stages: [
        {
          name: 'Germination',
          stage_order: 1,
          duration_days: 8,
          kc_value: 0.3,
          actions: [
            {
              type: 'irrigation',
              title: 'Nursery Bed Watering',
              description: 'Keep nursery bed moist for seed germination',
              how_to: 'Spray water 2-3 times daily to maintain constant moisture',
              frequency: 'daily',
              priority: 'high',
              alert_message: 'Consistent moisture is essential for tomato seed germination',
            },
            {
              type: 'monitoring',
              title: 'Germination Observation',
              description: 'Monitor seed sprouting',
              how_to: 'Check nursery bed daily for sprouting',
              frequency: 'daily',
              priority: 'high',
              alert_message: 'Expect germination in 5-8 days',
            },
          ],
        },
        {
          name: 'Seedling Stage',
          stage_order: 2,
          duration_days: 15,
          kc_value: 0.4,
          actions: [
            {
              type: 'irrigation',
              title: 'Seedling Watering',
              description: 'Maintain adequate moisture without waterlogging',
              how_to: 'Water gently when top soil becomes dry',
              frequency: 'daily',
              priority: 'high',
              alert_message: 'Avoid waterlogging which causes damping off disease',
            },
            {
              type: 'monitoring',
              title: 'Seedling Health Check',
              description: 'Monitor for diseases and nutritional deficiencies',
              how_to: 'Check for yellow leaves, damping off, or pest damage',
              frequency: 'daily',
              priority: 'medium',
              alert_message: 'Remove diseased seedlings immediately',
            },
            {
              type: 'treatment',
              title: 'Hardening Off',
              description: 'Gradually expose seedlings to outdoor conditions',
              how_to: 'Increase ventilation and light exposure gradually',
              frequency: 'ongoing',
              priority: 'medium',
              alert_message: 'Hardening prepares seedlings for field transplanting',
            },
          ],
        },
        {
          name: 'Transplanting Stage',
          stage_order: 3,
          duration_days: 20,
          kc_value: 0.5,
          actions: [
            {
              type: 'transplanting',
              title: 'Plot Preparation',
              description: 'Prepare field for transplanting',
              how_to: 'Add 10-15 tons/ha organic matter, plow and level field',
              frequency: 'once',
              priority: 'high',
              alert_message: 'Well-prepared soil ensures good plant establishment',
            },
            {
              type: 'transplanting',
              title: 'Seedling Transplanting',
              description: 'Transplant uniform 30-35 day old seedlings',
              how_to: 'Plant at 60x45 cm spacing (37,000 plants/ha)',
              frequency: 'once',
              priority: 'high',
              alert_message: 'Transplant in evening or cloudy days to reduce wilting',
            },
            {
              type: 'irrigation',
              title: 'Establishment Watering',
              description: 'Adequate watering for root establishment',
              how_to: 'Water immediately after transplanting and daily for first week',
              frequency: 'daily',
              priority: 'high',
              alert_message: 'Post-transplant irrigation prevents transplanting shock',
            },
          ],
        },
        {
          name: 'Vegetative Growth',
          stage_order: 4,
          duration_days: 25,
          kc_value: 0.6,
          actions: [
            {
              type: 'irrigation',
              title: 'Regular Irrigation',
              description: 'Maintain consistent soil moisture',
              how_to: 'Drip irrigation 25-30 mm every 2-3 days or check soil moisture',
              frequency: 'every-2-3-days',
              priority: 'high',
              alert_message: 'Consistent moisture prevents fruit cracking and blossom-end rot',
            },
            {
              type: 'fertilization',
              title: 'Nitrogen Application',
              description: 'Support vegetative growth',
              how_to: 'Apply 100-150 kg/ha nitrogen in 4-5 splits',
              frequency: 'every-2-weeks',
              priority: 'high',
              alert_message: 'Balanced nitrogen supports healthy foliage',
            },
            {
              type: 'treatment',
              title: 'Pruning & Support',
              description: 'Provide support structures and prune determinates if needed',
              how_to: 'Install stakes or trellising, remove lateral branches on indeterminate varieties',
              frequency: 'weekly',
              priority: 'medium',
              alert_message: 'Proper support improves air circulation and fruit quality',
            },
            {
              type: 'monitoring',
              title: 'Pest & Disease Monitoring',
              description: 'Monitor for early blight, leaf curl, and whiteflies',
              how_to: 'Scout plants regularly, apply neem oil or fungicide as needed',
              frequency: 'every-2-3-days',
              priority: 'high',
              alert_message: 'Early disease control prevents epidemic development',
            },
          ],
        },
        {
          name: 'Flowering Stage',
          stage_order: 5,
          duration_days: 20,
          kc_value: 0.85,
          actions: [
            {
              type: 'irrigation',
              title: 'Flowering Stage Watering',
              description: 'Maintain consistent soil moisture during flowering',
              how_to: 'Drip irrigation 30-35 mm every 2 days',
              frequency: 'every-2-days',
              priority: 'high',
              alert_message: 'Water stress during flowering reduces fruit set',
            },
            {
              type: 'fertilization',
              title: 'Boron & Calcium Application',
              description: 'Prevent blossom-end rot with calcium and boron',
              how_to: 'Apply 20 kg/ha boron and 50 kg/ha calcium nitrate',
              frequency: 'once',
              priority: 'high',
              alert_message: 'Calcium and boron prevent physiological disorders',
            },
            {
              type: 'monitoring',
              title: 'Pollination Success',
              description: 'Monitor flower and early fruit development',
              how_to: 'Check for fruit set, observe bee activity',
              frequency: 'every-3-4-days',
              priority: 'medium',
              alert_message: 'Good pollination ensures better fruit development',
            },
          ],
        },
        {
          name: 'Fruit Development & Ripening',
          stage_order: 6,
          duration_days: 32,
          kc_value: 0.9,
          actions: [
            {
              type: 'irrigation',
              title: 'Fruit Development Watering',
              description: 'Support fruit growth and maturation',
              how_to: 'Maintain consistent drip irrigation 35-40 mm every 2-3 days',
              frequency: 'every-2-3-days',
              priority: 'high',
              alert_message: 'Consistent moisture prevents fruit cracking',
            },
            {
              type: 'harvesting',
              title: 'Selective Harvesting',
              description: 'Harvest fruits progressively',
              how_to: 'Pick breaker stage fruits (first color break) every 2-3 days',
              frequency: 'every-2-3-days',
              priority: 'high',
              alert_message: 'Progressive harvesting encourages continued fruit production',
            },
            {
              type: 'monitoring',
              title: 'Quality Control',
              description: 'Monitor fruit quality and manage diseases',
              how_to: 'Inspect for cracks, diseases, and pest damage before harvest',
              frequency: 'every-2-3-days',
              priority: 'medium',
              alert_message: 'Maintain fruit quality for better market value',
            },
          ],
        },
      ],
    },
  ],
};

const seedDatabase = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('✓ Connected to database');
    console.log('✓ Initializing database schema...\n');

    // Create tables if they don't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS crops (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        duration_days INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS stages (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        crop_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        stage_order INT NOT NULL,
        duration_days INT NOT NULL,
        kc_value DECIMAL(3, 2) NOT NULL DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE,
        UNIQUE KEY unique_crop_stage (crop_id, stage_order)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS actions (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        stage_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        how_to TEXT,
        frequency VARCHAR(50),
        priority VARCHAR(20) DEFAULT 'medium',
        alert_message VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS calendars (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        parcelle_id INT NOT NULL,
        crop_id INT NOT NULL,
        sowing_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS calendar_stages (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        calendar_id INT NOT NULL,
        stage_id INT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE,
        FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE
      )
    `);

    console.log('✓ Database schema initialized');
    console.log('✓ Seeding data...\n');

    for (const crop of seedData.crops) {
      // Check if crop already exists
      const [existingCrop] = await connection.query(
        'SELECT id FROM crops WHERE name = ?',
        [crop.name]
      );

      let cropId;

      if (existingCrop.length > 0) {
        cropId = existingCrop[0].id;
        console.log(`ℹ Crop "${crop.name}" already exists (ID: ${cropId})`);
      } else {
        // Insert crop
        const [cropResult] = await connection.query(
          'INSERT INTO crops (name, duration_days) VALUES (?, ?)',
          [crop.name, crop.duration_days]
        );
        cropId = cropResult.insertId;
        console.log(`✓ Crop "${crop.name}" created (ID: ${cropId})`);
      }

      // Insert stages and actions
      for (const stage of crop.stages) {
        // Check if stage already exists
        const [existingStage] = await connection.query(
          'SELECT id FROM stages WHERE crop_id = ? AND stage_order = ?',
          [cropId, stage.stage_order]
        );

        let stageId;

        if (existingStage.length > 0) {
          stageId = existingStage[0].id;
          console.log(`  ℹ Stage "${stage.name}" already exists (ID: ${stageId})`);
        } else {
          // Insert stage
          const [stageResult] = await connection.query(
            'INSERT INTO stages (crop_id, name, stage_order, duration_days, kc_value) VALUES (?, ?, ?, ?, ?)',
            [cropId, stage.name, stage.stage_order, stage.duration_days, stage.kc_value]
          );
          stageId = stageResult.insertId;
          console.log(
            `  ✓ Stage "${stage.name}" created (ID: ${stageId}, Order: ${stage.stage_order})`
          );
        }

        // Insert actions
        if (stage.actions && stage.actions.length > 0) {
          for (const action of stage.actions) {
            // Check if action already exists
            const [existingAction] = await connection.query(
              'SELECT id FROM actions WHERE stage_id = ? AND title = ?',
              [stageId, action.title]
            );

            if (existingAction.length > 0) {
              console.log(`    ℹ Action "${action.title}" already exists`);
            } else {
              // Insert action
              await connection.query(
                'INSERT INTO actions (stage_id, type, title, description, how_to, frequency, priority, alert_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                  stageId,
                  action.type,
                  action.title,
                  action.description,
                  action.how_to,
                  action.frequency,
                  action.priority,
                  action.alert_message,
                ]
              );
              console.log(`    ✓ Action "${action.title}" created`);
            }
          }
        }
      }

      console.log('');
    }

    connection.end();
    console.log('✓ Database seeding complete!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
