const axios = require('axios');

/**
 * PlantNetService
 * Uses the free PlantID API for plant disease identification
 * No authentication required, free to use
 * Source: https://plantid.uc.r.appspot.com/
 */
class PlantNetService {
  constructor() {
    this.apiUrl = 'https://plantid.uc.r.appspot.com/api/v2/identification';
    this.timeout = 60000; // 60 seconds for API response
  }

  /**
   * Analyze plant image for diseases
   * @param {Buffer} imageBuffer - Image buffer from file upload
   * @returns {Promise<Object>} Plant identification results
   */
  async analyzeImage(imageBuffer) {
    try {
      console.log('📤 Sending to PlantID API...');
      
      // Convert buffer to base64 for API
      const imageBase64 = imageBuffer.toString('base64');
      const imageData = `data:image/jpeg;base64,${imageBase64}`;

      // Call PlantID API
      const response = await axios.post(
        this.apiUrl,
        {
          images: [imageData],
          plant_details: ['disease_details'],
          latitude: null,
          longitude: null,
          similar_images: true
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      );

      return this._parseResponse(response.data);
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * Parse PlantID API response
   * @private
   */
  _parseResponse(apiResponse) {
    if (!apiResponse.result || !apiResponse.result.classification) {
      throw new Error('Invalid response format from PlantID API');
    }

    const suggestions = apiResponse.result.classification.suggestions || [];
    
    if (suggestions.length === 0) {
      return {
        disease: 'Unknown Plant',
        confidence: 0,
        confidencePercent: '0%',
        description: 'Could not identify plant in image',
        treatment: 'Please try with a clearer image'
      };
    }

    // Get top suggestion
    const topMatch = suggestions[0];
    const confidence = topMatch.probability || 0;
    
    // Parse disease information if available
    const diseaseDetails = apiResponse.result.disease?.suggestions || [];
    let disease = topMatch.name || 'Unknown';
    let treatment = 'No specific treatment available';

    if (diseaseDetails.length > 0) {
      const topDisease = diseaseDetails[0];
      disease = topDisease.name || disease;
      treatment = topDisease.description || treatment;
    }

    return {
      disease: disease,
      confidence: confidence,
      confidencePercent: `${(confidence * 100).toFixed(1)}%`,
      description: topMatch.name,
      treatment: treatment,
      allSuggestions: suggestions.slice(0, 5).map(s => ({
        name: s.name,
        confidence: `${(s.probability * 100).toFixed(1)}%`
      }))
    };
  }

  /**
   * Handle API errors
   * @private
   */
  _handleError(error) {
    console.error('PlantID API Error:', error.message);

    if (error.response) {
      const status = error.response.status;
      if (status === 429) {
        return new Error('⏱️ API rate limit exceeded. Please try again later.');
      } else if (status === 400) {
        return new Error('❌ Invalid image format. Please use JPEG or PNG.');
      } else if (status === 500) {
        return new Error('🔧 PlantID API service temporarily unavailable.');
      }
    }

    if (error.code === 'ECONNABORTED') {
      return new Error('⏱️ Request timeout. Please try again with a smaller image.');
    }

    return new Error(`❌ Analysis failed: ${error.message}`);
  }
}

module.exports = PlantNetService;
