/**
 * Crop coefficient (Kc) values based on crop type and growth stage
 * FAO 56 methodology
 */
const CROP_COEFFICIENTS = {
  wheat: {
    initial: 0.3,    // Initial stage (0-10% cover)
    development: 0.5, // Development stage
    mid: 1.15,        // Mid season
    late: 0.4,        // Late season
    default: 0.8,
  },
  maize: {
    initial: 0.3,
    development: 0.6,
    mid: 1.2,
    late: 0.6,
    default: 0.9,
  },
  rice: {
    initial: 0.4,
    development: 0.7,
    mid: 1.0,
    late: 0.8,
    default: 0.8,
  },
  potato: {
    initial: 0.5,
    development: 0.75,
    mid: 1.15,
    late: 0.8,
    default: 0.85,
  },
  tomato: {
    initial: 0.4,
    development: 0.75,
    mid: 1.0,
    late: 0.6,
    default: 0.75,
  },
  alfalfa: {
    initial: 0.4,
    development: 0.9,
    mid: 1.1,
    late: 0.6,
    default: 0.85,
  },
  cotton: {
    initial: 0.4,
    development: 0.75,
    mid: 1.15,
    late: 0.6,
    default: 0.8,
  },
  default: {
    initial: 0.3,
    development: 0.6,
    mid: 1.0,
    late: 0.5,
    default: 0.7,
  },
};

/**
 * Get crop coefficient based on crop type and growth stage
 * @param {string} cropType - Type of crop
 * @param {string} stage - Growth stage (initial, development, mid, late)
 * @returns {number} Crop coefficient
 */
function getCropCoefficient(cropType, stage = 'default') {
  const crop = CROP_COEFFICIENTS[cropType?.toLowerCase()] || CROP_COEFFICIENTS.default;
  return crop[stage] || crop.default;
}

/**
 * Calculate water stress adjustment factor
 * Based on NDVI and stress percentage
 * @param {number} ndvi - NDVI value (0-1)
 * @param {number} stressPercentage - Stress percentage (0-100)
 * @returns {number} Adjustment factor (0.7-1.3)
 */
function getStressAdjustmentFactor(ndvi, stressPercentage) {
  // Low NDVI indicates poor crop health → increase water
  const ndviAdjustment = ndvi < 0.4 ? 1.2 : ndvi < 0.5 ? 1.1 : 1.0;

  // High stress → increase water
  const stressAdjustment = stressPercentage > 50 ? 1.3 : stressPercentage > 30 ? 1.15 : 1.0;

  return Math.min(ndviAdjustment * stressAdjustment, 1.3);
}

/**
 * Get irrigation priority based on stress level
 * @param {number} stressPercentage - Stress percentage (0-100)
 * @param {number} rainForecast - Expected rain in mm (next 24-48h)
 * @returns {string} Priority level
 */
function getPriority(stressPercentage, rainForecast = 0) {
  if (rainForecast > 10) {
    return 'LOW'; // Significant rainfall expected
  }

  if (stressPercentage > 50) {
    return 'HIGH';
  }

  if (stressPercentage > 30) {
    return 'MEDIUM';
  }

  return 'LOW';
}

/**
 * Calculate irrigation duration based on water amount and flow rate
 * @param {number} waterAmountMm - Water amount in mm
 * @param {number} areaHectares - Field area in hectares
 * @param {number} flowRateMmPerHour - Irrigation system flow rate (mm/h) - default 25mm/h
 * @returns {number} Duration in minutes
 */
function calculateDuration(waterAmountMm, areaHectares, flowRateMmPerHour = 25) {
  if (flowRateMmPerHour <= 0) return 0;
  const hoursNeeded = waterAmountMm / flowRateMmPerHour;
  return Math.ceil(hoursNeeded * 60);
}

/**
 * Get recommended irrigation time based on weather
 * Prefers early morning (5-7 AM) or late evening (6-8 PM)
 * @param {object} weather - Weather data with temperature, humidity
 * @returns {string} Recommended time (HH:MM format)
 */
function getRecommendedTime(weather = {}) {
  const temp = weather.temperature || 25;
  const humidity = weather.humidity || 60;

  // High temperature and low humidity → prefer early morning
  if (temp > 30 && humidity < 50) {
    return '06:00';
  }

  // Moderate conditions → late evening
  if (temp > 20 && humidity < 65) {
    return '18:30';
  }

  // Cool/humid → early morning
  return '07:00';
}

/**
 * Adjust water amount based on humidity
 * @param {number} baseAmount - Base water amount in mm
 * @param {number} humidity - Relative humidity (0-100%)
 * @returns {number} Adjusted water amount
 */
function adjustForHumidity(baseAmount, humidity) {
  if (humidity > 80) {
    return baseAmount * 0.7; // High humidity → reduce water
  }

  if (humidity > 60) {
    return baseAmount * 0.85;
  }

  if (humidity < 40) {
    return baseAmount * 1.15; // Low humidity → increase water
  }

  return baseAmount;
}

module.exports = {
  getCropCoefficient,
  getStressAdjustmentFactor,
  getPriority,
  calculateDuration,
  getRecommendedTime,
  adjustForHumidity,
};
