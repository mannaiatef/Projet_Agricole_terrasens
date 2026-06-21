const axios = require('axios');
const logger = require('../utils/logger');

class SentinelHubService {
  constructor() {
    this.clientId = process.env.SENTINEL_HUB_CLIENT_ID;
    this.clientSecret = process.env.SENTINEL_HUB_CLIENT_SECRET;
    this.authUrl = 'https://identity.dataspace.copernicus.eu/oauth/token';
    this.processApiUrl = 'https://sh.dataspace.copernicus.eu/api/v1/process';
    this.accessToken = null;
    this.tokenExpiry = null;

    if (!this.clientId || !this.clientSecret) {
      logger.warn('Sentinel Hub credentials not configured in environment variables');
    }
  }

  /**
   * Generate access token from Sentinel Hub
   * Tokens are cached and reused until expiry
   */
  async generateAccessToken() {
    try {
      // Check if we have a valid cached token
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        logger.info('Using cached Sentinel Hub token');
        return this.accessToken;
      }

      if (!this.clientId || !this.clientSecret) {
        throw new Error('Sentinel Hub credentials not configured');
      }

      logger.info('Generating new Sentinel Hub access token');

      const response = await axios.post(
        this.authUrl,
        `client_id=${encodeURIComponent(this.clientId)}&client_secret=${encodeURIComponent(this.clientSecret)}&grant_type=client_credentials`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );

      this.accessToken = response.data.access_token;
      // Token expires in response.data.expires_in seconds, cache for expires_in - 60 seconds
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;

      logger.info('Sentinel Hub token generated successfully', {
        expiresIn: response.data.expires_in
      });

      return this.accessToken;
    } catch (error) {
      logger.error('Failed to generate Sentinel Hub token', {
        message: error.message,
        status: error.response?.status
      });
      throw new Error('Failed to authenticate with Sentinel Hub');
    }
  }

  /**
   * Get satellite image from Sentinel Hub
   * @param {Object} geometry - GeoJSON geometry or bounding box
   * @param {string} imageType - 'NDVI' or 'TrueColor'
   * @param {Date} date - Date range for image search
   * @returns {Buffer} PNG image buffer
   */
  async getImage(geometry, imageType = 'NDVI', date = new Date()) {
    try {
      const token = await this.generateAccessToken();

      // Prepare bounding box from geometry
      const bbox = this._getBoundingBox(geometry);
      if (!bbox) {
        throw new Error('Invalid geometry provided');
      }

      logger.info('Requesting Sentinel Hub image', {
        imageType,
        bbox: bbox.join(','),
        date: date.toISOString()
      });

      const evalscript = this._getEvalscript(imageType);
      const requestBody = {
        input: {
          bounds: {
            bbox: bbox,
            properties: [{ name: 'datetime', value: this._formatDate(date) }]
          },
          data: [
            {
              type: 'sentinel-2-l2a',
              dataFilter: {
                timeRange: {
                  from: this._formatDate(new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000)), // Last 30 days
                  to: this._formatDate(date)
                },
                mosaickingOrder: 'mostRecent'
              }
            }
          ]
        },
        output: {
          width: 512,
          height: 512,
          responses: [
            {
              identifier: 'default',
              format: {
                type: 'image/png'
              }
            }
          ]
        },
        evalscript: evalscript
      };

      const response = await axios.post(
        this.processApiUrl,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 30000
        }
      );

      logger.info('Successfully retrieved Sentinel Hub image', {
        imageType,
        size: response.data.length
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to retrieve Sentinel Hub image', {
        message: error.message,
        status: error.response?.status,
        imageType
      });
      throw error;
    }
  }

  /**
   * Get image with metadata including acquisition date
   */
  async getImageWithMetadata(geometry, imageType = 'NDVI') {
    try {
      const token = await this.generateAccessToken();
      const bbox = this._getBoundingBox(geometry);

      if (!bbox) {
        throw new Error('Invalid geometry provided');
      }

      logger.info('Requesting Sentinel Hub image with metadata', { imageType });

      const evalscript = this._getEvalscript(imageType);

      // First, get the image
      const imageData = await this.getImage(geometry, imageType);

      // Get metadata about the image
      const metadata = await this._getImageMetadata(token, bbox, imageType);

      return {
        image: imageData,
        metadata: {
          acquisitionDate: metadata.acquisitionDate,
          cloudCoverage: metadata.cloudCoverage,
          imageType: imageType,
          bbox: bbox
        }
      };
    } catch (error) {
      logger.error('Failed to retrieve image with metadata', {
        message: error.message
      });
      throw error;
    }
  }

  /**
   * Get NDVI visualization with color scale
   * Returns raw image with NDVI color mapping
   */
  async getNDVIVisualization(geometry) {
    try {
      logger.info('Generating NDVI visualization');

      // In development mode, generate mock image if no Sentinel Hub credentials
      if (!this.clientId || !this.clientSecret) {
        logger.info('[Dev Mock] Generating mock NDVI visualization');
        return this._generateMockImageBuffer(512, 512, 'NDVI');
      }

      const evalscript = `
        //VERSION=3
        function setup() {
          return {
            input: [{
              bands: ["B04", "B08", "dataMask"]
            }],
            output: {
              bands: 3,
              sampleType: "UINT8"
            }
          };
        }

        function evaluatePixel(sample) {
          let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
          
          // Color scale: Red (low NDVI) -> Yellow (medium) -> Green (high)
          let r, g, b;
          
          if (ndvi < 0.2) {
            // Red for unhealthy vegetation
            r = 255;
            g = 0;
            b = 0;
          } else if (ndvi < 0.35) {
            // Orange-red
            r = 255;
            g = 100;
            b = 0;
          } else if (ndvi < 0.45) {
            // Yellow
            r = 255;
            g = 255;
            b = 0;
          } else if (ndvi < 0.55) {
            // Yellow-green
            r = 180;
            g = 255;
            b = 0;
          } else {
            // Green for healthy vegetation
            r = 0;
            g = 255;
            b = 0;
          }
          
          return [r, g, b];
        }
      `;

      const token = await this.generateAccessToken();
      const bbox = this._getBoundingBox(geometry);

      if (!bbox) {
        throw new Error('Invalid geometry provided');
      }

      const requestBody = {
        input: {
          bounds: {
            bbox: bbox
          },
          data: [
            {
              type: 'sentinel-2-l2a',
              dataFilter: {
                timeRange: {
                  from: this._formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
                  to: this._formatDate(new Date())
                },
                mosaickingOrder: 'mostRecent'
              }
            }
          ]
        },
        output: {
          width: 512,
          height: 512,
          responses: [
            {
              identifier: 'default',
              format: {
                type: 'image/png'
              }
            }
          ]
        },
        evalscript: evalscript
      };

      const response = await axios.post(
        this.processApiUrl,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 30000
        }
      );

      logger.info('NDVI visualization generated successfully');
      return response.data;
    } catch (error) {
      logger.error('Failed to generate NDVI visualization', {
        message: error.message
      });
      throw error;
    }
  }

  /**
   * Get True Color image
   */
  async getTrueColorImage(geometry) {
    try {
      logger.info('Generating True Color image');

      // In development mode, generate mock image if no Sentinel Hub credentials
      if (!this.clientId || !this.clientSecret) {
        logger.info('[Dev Mock] Generating mock True Color image');
        return this._generateMockImageBuffer(512, 512, 'TrueColor');
      }

      const evalscript = `
        //VERSION=3
        function setup() {
          return {
            input: [{
              bands: ["B02", "B03", "B04"]
            }],
            output: {
              bands: 3,
              sampleType: "UINT8"
            }
          };
        }

        function evaluatePixel(sample) {
          return [sample.B04, sample.B03, sample.B02];
        }
      `;

      const token = await this.generateAccessToken();
      const bbox = this._getBoundingBox(geometry);

      if (!bbox) {
        throw new Error('Invalid geometry provided');
      }

      const requestBody = {
        input: {
          bounds: {
            bbox: bbox
          },
          data: [
            {
              type: 'sentinel-2-l2a',
              dataFilter: {
                timeRange: {
                  from: this._formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
                  to: this._formatDate(new Date())
                },
                mosaickingOrder: 'mostRecent'
              }
            }
          ]
        },
        output: {
          width: 512,
          height: 512,
          responses: [
            {
              identifier: 'default',
              format: {
                type: 'image/png'
              }
            }
          ]
        },
        evalscript: evalscript
      };

      const response = await axios.post(
        this.processApiUrl,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 30000
        }
      );

      logger.info('True Color image generated successfully');
      return response.data;
    } catch (error) {
      logger.error('Failed to generate True Color image', {
        message: error.message
      });
      throw error;
    }
  }

  /**
   * Get Moisture visualization image
   */
  async getMoistureImage(geometry) {
    try {
      logger.info('Generating Moisture visualization');

      if (!this.clientId || !this.clientSecret) {
        logger.info('[Dev Mock] Generating mock Moisture image');
        return this._generateMockImageBuffer(512, 512, 'Moisture');
      }

      const evalscript = `
        //VERSION=3
        function setup() {
          return {
            input: [{
              bands: ["B11", "B8A", "dataMask"]
            }],
            output: {
              bands: 3,
              sampleType: "UINT8"
            }
          };
        }

        function evaluatePixel(sample) {
          let ndmi = (sample.B8A - sample.B11) / (sample.B8A + sample.B11);
          let r, g, b;
          if (ndmi < 0.2) { r = 139; g = 69; b = 19; }
          else if (ndmi < 0.4) { r = 210; g = 180; b = 140; }
          else if (ndmi < 0.6) { r = 144; g = 238; b = 144; }
          else { r = 0; g = 128; b = 0; }
          return [r, g, b];
        }
      `;

      const token = await this.generateAccessToken();
      const bbox = this._getBoundingBox(geometry);

      if (!bbox) throw new Error('Invalid geometry provided');

      const requestBody = {
        input: {
          bounds: { bbox },
          data: [{
            type: 'sentinel-2-l2a',
            dataFilter: {
              timeRange: {
                from: this._formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
                to: this._formatDate(new Date())
              },
              mosaickingOrder: 'mostRecent'
            }
          }]
        },
        output: {
          width: 512,
          height: 512,
          responses: [{ identifier: 'default', format: { type: 'image/png' } }]
        },
        evalscript
      };

      const response = await axios.post(this.processApiUrl, requestBody, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        responseType: 'arraybuffer',
        timeout: 30000
      });

      logger.info('Moisture image generated successfully');
      return response.data;
    } catch (error) {
      logger.error('Failed to generate Moisture image', { message: error.message });
      throw error;
    }
  }

  /**
   * Private method to get bounding box from geometry
   */
  _getBoundingBox(geometry) {
    try {
      // If already a bbox array [minLon, minLat, maxLon, maxLat]
      if (Array.isArray(geometry) && geometry.length === 4) {
        return geometry;
      }

      // If GeoJSON polygon
      if (geometry.type === 'Polygon' && geometry.coordinates) {
        const coords = geometry.coordinates[0];
        const lons = coords.map(c => c[0]);
        const lats = coords.map(c => c[1]);

        return [
          Math.min(...lons),
          Math.min(...lats),
          Math.max(...lons),
          Math.max(...lats)
        ];
      }

      logger.warn('Unsupported geometry type', { type: geometry.type });
      return null;
    } catch (error) {
      logger.error('Failed to extract bounding box', { message: error.message });
      return null;
    }
  }

  /**
   * Get appropriate evalscript for image type
   */
  _getEvalscript(imageType) {
    if (imageType === 'NDVI') {
      return this._getNDVIEvalscript();
    } else if (imageType === 'TrueColor') {
      return this._getTrueColorEvalscript();
    } else if (imageType === 'Moisture') {
      return this._getMoistureEvalscript();
    }
    return this._getNDVIEvalscript(); // Default to NDVI
  }

  /**
   * NDVI evalscript
   */
  _getNDVIEvalscript() {
    return `
      //VERSION=3
      function setup() {
        return {
          input: [{
            bands: ["B04", "B08", "dataMask"]
          }],
          output: {
            bands: 3,
            sampleType: "UINT8"
          }
        };
      }

      function evaluatePixel(sample) {
        let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
        
        let r, g, b;
        
        if (ndvi < 0.2) {
          r = 255; g = 0; b = 0;
        } else if (ndvi < 0.35) {
          r = 255; g = 100; b = 0;
        } else if (ndvi < 0.45) {
          r = 255; g = 255; b = 0;
        } else if (ndvi < 0.55) {
          r = 180; g = 255; b = 0;
        } else {
          r = 0; g = 255; b = 0;
        }
        
        return [r, g, b];
      }
    `;
  }

  /**
   * True Color evalscript
   */
  _getTrueColorEvalscript() {
    return `
      //VERSION=3
      function setup() {
        return {
          input: [{
            bands: ["B02", "B03", "B04"]
          }],
          output: {
            bands: 3,
            sampleType: "UINT8"
          }
        };
      }

      function evaluatePixel(sample) {
        return [sample.B04, sample.B03, sample.B02];
      }
    `;
  }

  /**
   * Moisture visualization evalscript
   */
  _getMoistureEvalscript() {
    return `
      //VERSION=3
      function setup() {
        return {
          input: [{
            bands: ["B11", "B8A", "dataMask"]
          }],
          output: {
            bands: 3,
            sampleType: "UINT8"
          }
        };
      }

      function evaluatePixel(sample) {
        // NDMI = (NIR - SWIR) / (NIR + SWIR)
        let ndmi = (sample.B8A - sample.B11) / (sample.B8A + sample.B11);
        
        let r, g, b;
        
        if (ndmi < 0.2) {
          r = 139; g = 69; b = 19; // Brown - dry
        } else if (ndmi < 0.4) {
          r = 210; g = 180; b = 140; // Tan - moderate
        } else if (ndmi < 0.6) {
          r = 144; g = 238; b = 144; // Light green - moist
        } else {
          r = 0; g = 128; b = 0; // Dark green - wet
        }
        
        return [r, g, b];
      }
    `;
  }

  /**
   * Format date to ISO string
   */
  _formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Generate mock image buffer for development/testing
   * Creates a PNG-like buffer with colored zones representing different conditions
   */
  _generateMockImageBuffer(width = 512, height = 512, imageType = 'NDVI') {
    try {
      const zlib = require('zlib');

      // Build raw RGBA pixel rows (with filter byte 0 per row)
      const rowSize = width * 4 + 1;
      const rawRows = Buffer.alloc(height * rowSize);

      for (let y = 0; y < height; y++) {
        const rowOffset = y * rowSize;
        rawRows[rowOffset] = 0; // No filter

        for (let x = 0; x < width; x++) {
          const pixelOffset = rowOffset + 1 + x * 4;
          const zoneType =
            x < width / 3 ? 'healthy' :
            x < (2 * width) / 3 ? 'medium' :
            'stress';

          let r, g, b;

          if (imageType === 'NDVI') {
            if (zoneType === 'healthy') { r = 0; g = 255; b = 0; }
            else if (zoneType === 'medium') { r = 255; g = 255; b = 0; }
            else { r = 255; g = 0; b = 0; }
          } else if (imageType === 'TrueColor') {
            if (zoneType === 'healthy') { r = 34; g = 139; b = 34; }
            else if (zoneType === 'medium') { r = 189; g = 183; b = 107; }
            else { r = 139; g = 90; b = 43; }
          } else {
            if (zoneType === 'healthy') { r = 0; g = 100; b = 0; }
            else if (zoneType === 'medium') { r = 210; g = 180; b = 140; }
            else { r = 139; g = 69; b = 19; }
          }

          rawRows.writeUInt8(r, pixelOffset);
          rawRows.writeUInt8(g, pixelOffset + 1);
          rawRows.writeUInt8(b, pixelOffset + 2);
          rawRows.writeUInt8(255, pixelOffset + 3);
        }
      }

      const compressed = zlib.deflateSync(rawRows);

      // PNG chunks
      const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

      const ihdr = Buffer.alloc(13);
      ihdr.writeUInt32BE(width, 0);
      ihdr.writeUInt32BE(height, 4);
      ihdr.writeUInt8(8, 8);   // bit depth
      ihdr.writeUInt8(6, 9);   // color type RGBA
      ihdr.writeUInt8(0, 10);  // compression
      ihdr.writeUInt8(0, 11);  // filter
      ihdr.writeUInt8(0, 12);  // interlace

      const ihdrChunk = this._pngChunk('IHDR', ihdr);
      const idatChunk = this._pngChunk('IDAT', compressed);
      const iendChunk = this._pngChunk('IEND', Buffer.alloc(0));

      return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
    } catch (error) {
      logger.error('[Dev Mock] Failed to generate mock image', { message: error.message });
      return this._createFallbackPng();
    }
  }

  _pngChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeB = Buffer.from(type, 'ascii');
    const crcInput = Buffer.concat([typeB, data]);
    const crcVal = this._crc32(crcInput);
    const crcB = Buffer.alloc(4);
    crcB.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeB, data, crcB]);
  }

  _crc32(data) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
      c = this._crc32Table()[(c ^ data[i]) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  _crc32Table() {
    if (!this._crcTable) {
      this._crcTable = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let crc = i;
        for (let j = 0; j < 8; j++) {
          crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
        }
        this._crcTable[i] = crc;
      }
    }
    return this._crcTable;
  }

  _createFallbackPng() {
    // 1x1 green pixel PNG (valid)
    const { deflateSync } = require('zlib');
    const raw = Buffer.from([0, 0, 255, 0, 255, 0, 255, 255]); // filter=0, RGBA green
    const compressed = deflateSync(raw);
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(1, 0); ihdr.writeUInt32BE(1, 4);
    ihdr.writeUInt8(8, 8); ihdr.writeUInt8(6, 9);
    ihdr.writeUInt8(0, 10); ihdr.writeUInt8(0, 11); ihdr.writeUInt8(0, 12);
    const ihdrC = this._pngChunk('IHDR', ihdr);
    const idatC = this._pngChunk('IDAT', compressed);
    const iendC = this._pngChunk('IEND', Buffer.alloc(0));
    return Buffer.concat([sig, ihdrC, idatC, iendC]);
  }

  /**
   * Get image metadata from Sentinel Hub
   */
  async _getImageMetadata(token, bbox, imageType) {
    try {
      // This would typically call another API endpoint for metadata
      // For now, return basic metadata
      return {
        acquisitionDate: new Date().toISOString(),
        cloudCoverage: 0,
        imageType: imageType,
        bbox: bbox
      };
    } catch (error) {
      logger.error('Failed to get image metadata', { message: error.message });
      return {
        acquisitionDate: new Date().toISOString(),
        cloudCoverage: 0,
        imageType: imageType,
        bbox: bbox
      };
    }
  }
}

module.exports = new SentinelHubService();
