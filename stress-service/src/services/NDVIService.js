const logger = require('../utils/logger');

class NDVIService {
  /**
   * Compute NDVI for raster data
   * NDVI = (NIR - Red) / (NIR + Red)
   * 
   * @param {Buffer} nirBand - Near Infrared band data
   * @param {Buffer} redBand - Red band data
   * @param {number} width - Image width in pixels
   * @param {number} height - Image height in pixels
   * @param {number} dataType - Data type (1=uint8, 2=uint16, etc.)
   * @returns {Object} NDVI analysis results
   */
  computeNDVI(nirBand, redBand, width, height, dataType = 2) {
    try {
      logger.info('Computing NDVI', { width, height, dataType });

      const pixelSize = dataType === 1 ? 1 : 2; // 1 byte for uint8, 2 bytes for uint16
      const ndviValues = [];
      const validPixels = [];

      for (let i = 0; i < nirBand.length; i += pixelSize) {
        const nir = this._readPixelValue(nirBand, i, pixelSize);
        const red = this._readPixelValue(redBand, i, pixelSize);

        // Skip no-data values (typically 0 or max value)
        if (nir === 0 && red === 0) continue;

        const denominator = nir + red;
        if (denominator === 0) continue;

        const ndvi = (nir - red) / denominator;
        ndviValues.push(ndvi);
        validPixels.push({ index: i / pixelSize, ndvi, nir, red });
      }

      if (ndviValues.length === 0) {
        throw new Error('No valid NDVI pixels computed');
      }

      const stats = this._calculateStatistics(ndviValues, validPixels);
      logger.info('NDVI computation completed', { 
        validPixelCount: stats.pixelCount,
        meanNdvi: stats.meanNdvi.toFixed(4)
      });

      return stats;
    } catch (error) {
      logger.error('NDVI computation failed', { message: error.message });
      throw error;
    }
  }

  /**
   * Classify NDVI values into stress levels
   * HIGH: NDVI <= 0.35
   * MEDIUM: 0.35 < NDVI <= 0.45
   * HEALTHY: NDVI > 0.45
   */
  classifyStress(ndviValue) {
    if (ndviValue > 0.45) return 'healthy';
    else if (ndviValue > 0.35) return 'medium';
    else return 'high';
  }

  /**
   * Calculate stress percentage based on NDVI distribution
   */
  calculateStressPercentage(validPixels) {
    if (validPixels.length === 0) return 0;

    const stressedPixels = validPixels.filter(p => p.ndvi < 0.5);
    const highStressPixels = validPixels.filter(p => p.ndvi < 0.3);

    return {
      stressPercentage: (stressedPixels.length / validPixels.length) * 100,
      highStressPixels: highStressPixels.length,
      mediumStressPixels: stressedPixels.length - highStressPixels.length,
      healthyPixels: validPixels.length - stressedPixels.length
    };
  }

  /**
   * Generate pixel stress map for GeoJSON conversion
   * Returns array of pixels with coordinates and stress info
   */
  generatePixelStressMap(validPixels, width, height, geoTransform) {
    const pixelMap = validPixels.map(pixel => {
      const pixelIndex = pixel.index;
      const row = Math.floor(pixelIndex / width);
      const col = pixelIndex % width;

      // Convert pixel coordinates to geographic coordinates
      const [lon, lat] = this._pixelToGeo(row, col, geoTransform, width, height);

      return {
        pixelIndex,
        row,
        col,
        longitude: lon,
        latitude: lat,
        ndvi: pixel.ndvi,
        stressLevel: this.classifyStress(pixel.ndvi),
        nir: pixel.nir,
        red: pixel.red
      };
    });

    // 🔴 CRITICAL DEBUG: Log coordinate bounds
    if (pixelMap.length > 0) {
      const lons = pixelMap.map(p => p.longitude);
      const lats = pixelMap.map(p => p.latitude);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      
      console.log('[NDVIService] Pixel coordinates bounds:');
      console.log(`  Longitude: [${minLon.toFixed(4)}, ${maxLon.toFixed(4)}]`);
      console.log(`  Latitude: [${minLat.toFixed(4)}, ${maxLat.toFixed(4)}]`);
      console.log('[NDVIService] GeoTransform:', geoTransform);
      console.log('[NDVIService] Sample pixels:');
      console.log('  First pixel:', pixelMap[0]);
      console.log('  Sample middle:', pixelMap[Math.floor(pixelMap.length / 2)]);
      console.log('  Last pixel:', pixelMap[pixelMap.length - 1]);
    }

    return pixelMap;
  }

  // Convert pixel index to geographic coordinates using geotransform
  // SAFE implementation that handles both 4-element and 6-element formats
  _pixelToGeo(row, col, geoTransform, width, height) {
    if (!geoTransform || geoTransform.length === 0) {
      console.warn('[NDVIService] No geoTransform provided, using default bounds');
      // Fallback: simple linear scaling
      const lon = (col / width);
      const lat = 1 - (row / height);
      return [lon, lat];
    }

    // Standard GeoTIFF 6-element format: [minLon, pixelWidth, rotX, maxLat, rotY, pixelHeight]
    if (geoTransform.length >= 6) {
      const [minLon, pixelWidth, rotX, maxLat, rotY, pixelHeight] = geoTransform;
      const lon = minLon + col * pixelWidth + row * rotX;
      const lat = maxLat + col * rotY + row * pixelHeight;
      return [lon, lat];
    }

    // 4-element custom format: [minLon, pixelWidth, minLat, pixelHeight]
    if (geoTransform.length === 4) {
      const [minLon, pixelWidth, minLat, pixelHeight] = geoTransform;
      const lon = minLon + col * pixelWidth;
      const lat = minLat + row * pixelHeight;
      return [lon, lat];
    }

    // Fallback
    console.warn('[NDVIService] Unexpected geoTransform length:', geoTransform.length);
    return [0, 0];
  }

  // Read pixel value based on data type
  _readPixelValue(buffer, offset, pixelSize) {
    if (pixelSize === 1) {
      return buffer[offset];
    } else if (pixelSize === 2) {
      // Little-endian uint16
      return buffer.readUInt16LE(offset);
    } else if (pixelSize === 4) {
      // Float32
      return buffer.readFloatLE(offset);
    }
    return 0;
  }

  // Calculate statistical metrics
  _calculateStatistics(ndviValues, validPixels) {
    const sorted = [...ndviValues].sort((a, b) => a - b);
    const mean = ndviValues.reduce((a, b) => a + b, 0) / ndviValues.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    // Standard deviation
    const variance = ndviValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / ndviValues.length;
    const stdDev = Math.sqrt(variance);

    // Stress metrics
    const stressMetrics = this.calculateStressPercentage(validPixels);

    return {
      meanNdvi: mean,
      medianNdvi: median,
      minNdvi: min,
      maxNdvi: max,
      stdDevNdvi: stdDev,
      pixelCount: ndviValues.length,
      stressedPixelCount: validPixels.filter(p => p.ndvi < 0.5).length,
      highStressPixelCount: validPixels.filter(p => p.ndvi < 0.3).length,
      stressPercentage: stressMetrics.stressPercentage,
      healthyPixels: stressMetrics.healthyPixels,
      ndviDistribution: this._getDistribution(ndviValues)
    };
  }

  // Get NDVI value distribution
  _getDistribution(ndviValues) {
    const bins = {
      veryLow: ndviValues.filter(v => v < 0.2).length,
      low: ndviValues.filter(v => v >= 0.2 && v < 0.4).length,
      medium: ndviValues.filter(v => v >= 0.4 && v < 0.6).length,
      high: ndviValues.filter(v => v >= 0.6 && v < 0.8).length,
      veryHigh: ndviValues.filter(v => v >= 0.8).length
    };

    return {
      bins,
      percentages: {
        veryLow: (bins.veryLow / ndviValues.length * 100).toFixed(2),
        low: (bins.low / ndviValues.length * 100).toFixed(2),
        medium: (bins.medium / ndviValues.length * 100).toFixed(2),
        high: (bins.high / ndviValues.length * 100).toFixed(2),
        veryHigh: (bins.veryHigh / ndviValues.length * 100).toFixed(2)
      }
    };
  }
}

module.exports = new NDVIService();
