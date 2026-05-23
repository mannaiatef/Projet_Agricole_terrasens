/**
 * MockDiseaseService
 * Provides realistic mock disease detection for testing and development
 * Replace with real API integration when ready
 */
class MockDiseaseService {
  constructor() {
    this.mockDiseases = [
      {
        name: 'Early Blight (Solanum lycopersicum)',
        confidence: 0.87,
        description: 'Fungal disease affecting tomato leaves',
        treatment: 'Fungicide spray, remove infected leaves',
        severity: 'medium'
      },
      {
        name: 'Powdery Mildew (Erysiphe)',
        confidence: 0.72,
        description: 'White powder coating on plant surfaces',
        treatment: 'Sulfur-based fungicide, improve air circulation',
        severity: 'low'
      },
      {
        name: 'Late Blight (Phytophthora infestans)',
        confidence: 0.91,
        description: 'Water-soaked spots on leaves and stems',
        treatment: 'Copper/chlorothalonil fungicide, remove infected plants',
        severity: 'critical'
      },
      {
        name: 'Leaf Spot (Septoria lycopersici)',
        confidence: 0.78,
        description: 'Circular spots with concentric rings',
        treatment: 'Copper fungicide, pruning to improve air flow',
        severity: 'medium'
      },
      {
        name: 'Rust (Puccinia species)',
        confidence: 0.65,
        description: 'Orange/brown dusty pustules on leaf undersides',
        treatment: 'Sulfur or copper-based fungicide',
        severity: 'low'
      },
      {
        name: 'Bacterial Leaf Scorch',
        confidence: 0.69,
        description: 'Brown necrotic lesions with yellow halos',
        treatment: 'Remove infected branches, disinfect tools',
        severity: 'medium'
      }
    ];
  }

  /**
   * Analyze image and return mock disease results
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {Promise<Object>} Mock disease analysis
   */
  async analyzeImage(imageBuffer) {
    try {
      // Simulate API processing time (3-8 seconds)
      const processingTime = Math.random() * 5000 + 3000;
      await new Promise(resolve => setTimeout(resolve, processingTime));

      // Select a random disease from our mock data
      const randomDisease = this.mockDiseases[
        Math.floor(Math.random() * this.mockDiseases.length)
      ];

      // Add slight variance to confidence
      const confidenceVariance = (Math.random() - 0.5) * 0.1;
      const confidence = Math.min(1, Math.max(0, randomDisease.confidence + confidenceVariance));

      return {
        disease: randomDisease.name,
        confidence: confidence,
        confidencePercent: `${(confidence * 100).toFixed(1)}%`,
        description: randomDisease.description,
        treatment: randomDisease.treatment,
        severity: randomDisease.severity,
        allSuggestions: this.mockDiseases.map(d => ({
          name: d.name,
          confidence: `${(d.confidence * 100).toFixed(1)}%`,
          severity: d.severity
        })),
        // Mark this as mock data for transparency
        isMockData: true,
        modelSource: 'Mock Service (for development/testing)'
      };
    } catch (error) {
      throw new Error(`❌ Mock analysis failed: ${error.message}`);
    }
  }
}

module.exports = MockDiseaseService;
