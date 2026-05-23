const axios = require('axios');

/**
 * HuggingFaceService
 * Handles integration with Hugging Face API for disease detection
 */
class HuggingFaceService {
  constructor() {
    this.apiKey = process.env.HUGGING_FACE_API_KEY;
    // Use proven working public models
    this.modelId = process.env.HUGGING_FACE_MODEL || 'facebook/dino-vitb14';
    this.fallbackModelId = 'google/vit-base-patch16-224'; // General image classification fallback
    this.apiUrl = `https://api-inference.huggingface.co/models/${this.modelId}`;
    this.fallbackApiUrl = `https://api-inference.huggingface.co/models/${this.fallbackModelId}`;
    this.timeout = 120000; // 120 seconds (increased from 30)
    this.retryAttempts = 3;
    this.retryDelay = 2000; // 2 seconds between retries
  }

  /**
   * Analyze plant disease from image buffer with retry logic
   * @param {Buffer} imageBuffer - Image buffer from multipart upload
   * @returns {Promise<Object>} API response with predictions
   */
  async analyzeImage(imageBuffer) {
    if (!this.apiKey) {
      throw new Error('HUGGING_FACE_API_KEY not configured');
    }

    // Try primary model first, then fallback if needed
    let lastError;
    
    try {
      return await this._analyzeWithRetry(imageBuffer, this.apiUrl);
    } catch (error) {
      lastError = error;
      console.warn('Primary model failed, trying fallback model:', error.message);
    }

    // Try fallback model
    try {
      const result = await this._analyzeWithRetry(imageBuffer, this.fallbackApiUrl);
      console.log('✅ Fallback model successful');
      // Mark result as using fallback
      result.modelUsed = 'fallback';
      return result;
    } catch (fallbackError) {
      console.error('Both models failed:', fallbackError.message);
      throw fallbackError;
    }
  }

  /**
   * Internal method to analyze with retry logic
   * @private
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} apiUrl - API endpoint URL
   * @returns {Promise<Object>} Parsed prediction
   */
  async _analyzeWithRetry(imageBuffer, apiUrl) {
    let lastError;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`📤 Sending to Hugging Face (attempt ${attempt}/${this.retryAttempts})...`);
        const response = await axios.post(
          apiUrl,
          imageBuffer,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'image/jpeg'
            },
            timeout: this.timeout,
            maxRedirects: 5
          }
        );

        return this._parseResponse(response.data);
      } catch (error) {
        lastError = error;
        console.warn(`❌ Attempt ${attempt} failed:`, error.message);

        // Don't retry on authentication errors
        if (error.response?.status === 401) {
          throw this._handleError(error);
        }

        // Wait before retrying (except on last attempt)
        if (attempt < this.retryAttempts) {
          console.log(`⏳ Waiting ${this.retryDelay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    throw this._handleError(lastError);
  }

  /**
   * Parse Hugging Face API response
   * @private
   * @param {Array|Object} predictions - Raw predictions from HF API
   * @returns {Object} Parsed prediction with top result
   */
  _parseResponse(predictions) {
    // Handle different response formats
    let items = Array.isArray(predictions) ? predictions : 
                (predictions && Array.isArray(predictions[0])) ? predictions[0] : 
                [predictions];

    if (!items || items.length === 0) {
      throw new Error('Invalid response from Hugging Face API');
    }

    // Sort by score descending and take top result
    const sorted = items.sort((a, b) => 
      (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0)
    );

    const topPrediction = sorted[0];
    
    // Extract score and convert to percentage
    let score = parseFloat(topPrediction.score || 0);
    let confidence = Math.round(score * 100);

    // Ensure confidence is between 0-100
    confidence = Math.max(0, Math.min(100, confidence));

    return {
      disease: topPrediction.label || 'Unknown Disease',
      confidence: confidence / 100, // Return as decimal (0-1)
      confidencePercent: confidence, // Also return as percentage
      topPredictions: sorted.slice(0, 3).map(p => ({
        label: p.label,
        score: parseFloat(p.score || 0),
        scorePercent: Math.round(parseFloat(p.score || 0) * 100)
      })),
      rawResponse: items
    };
  }

  /**
   * Handle API errors with meaningful messages
   * @private
   * @param {Error} error - Original error
   * @returns {Error} Processed error
   */
  _handleError(error) {
    if (error.response) {
      // API returned error response
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401) {
        return new Error('❌ Hugging Face API authentication failed. Check API key.');
      } else if (status === 429) {
        return new Error('⏱️ Hugging Face API rate limit exceeded. Please try again later.');
      } else if (status === 500 || status === 503) {
        return new Error('🔧 Hugging Face API service unavailable. Please try again later. (Status: ' + status + ')');
      } else if (status === 502 || status === 504) {
        return new Error('🌐 Hugging Face API temporarily unreachable. Please try again.');
      }
      
      const errorMessage = data?.error?.message || data?.error || `status ${status}`;
      return new Error(`❌ Hugging Face API error: ${errorMessage}`);
    } else if (error.code === 'ECONNABORTED') {
      return new Error('⏱️ Hugging Face API request timeout. The model may be starting up (first request takes longer) or the image may be too large. Please try again.');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      return new Error('🌐 Network error. Unable to connect to Hugging Face API. Check your internet connection.');
    } else if (error.message.includes('timeout')) {
      return new Error('⏱️ Request timeout. Please try a smaller image or try again later.');
    }

    return new Error(`❌ Error: ${error.message || 'Unknown error occurred'}`);
  }

  /**
   * Validate image before sending to API
   * @param {Buffer} imageBuffer - Image buffer
   * @param {number} maxSize - Maximum file size in bytes
   * @returns {Object} Validation result {valid: boolean, error?: string}
   */
  static validateImage(imageBuffer, maxSize = 5242880) {
    if (!imageBuffer || imageBuffer.length === 0) {
      return { valid: false, error: 'Image buffer is empty' };
    }

    if (imageBuffer.length > maxSize) {
      return { 
        valid: false, 
        error: `Image size exceeds maximum of ${maxSize / 1024 / 1024}MB` 
      };
    }

    return { valid: true };
  }
}

module.exports = HuggingFaceService;
