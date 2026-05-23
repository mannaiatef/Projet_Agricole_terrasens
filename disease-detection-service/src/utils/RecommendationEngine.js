/**
 * RecommendationEngine
 * Rule-based logic to generate treatment recommendations based on detected disease
 */
class RecommendationEngine {
  /**
   * Disease treatment mapping
   * Maps disease patterns to recommended actions
   */
  static DISEASE_RECOMMENDATIONS = {
    blight: {
      treatments: ['fungicide (chlorothalonil or mancozeb)', 'reduce irrigation frequency'],
      actions: ['Remove infected leaves', 'Increase air circulation', 'Avoid overhead watering'],
      urgency: 'high',
      treatmentType: 'fungicide'
    },
    mildew: {
      treatments: ['fungicide (sulfur-based)', 'reduce humidity'],
      actions: ['Improve air circulation', 'Prune dense foliage', 'Water at base only'],
      urgency: 'medium',
      treatmentType: 'fungicide'
    },
    rust: {
      treatments: ['fungicide (triad or similar)', 'remove infected tissue'],
      actions: ['Remove infected leaves immediately', 'Improve spacing', 'Reduce humidity'],
      urgency: 'high',
      treatmentType: 'fungicide'
    },
    'leaf spot': {
      treatments: ['copper fungicide', 'remove affected leaves'],
      actions: ['Apply fungicide', 'Maintain proper spacing', 'Reduce leaf wetness'],
      urgency: 'medium',
      treatmentType: 'fungicide'
    },
    wilt: {
      treatments: ['improve drainage', 'check soil moisture'],
      actions: ['Ensure proper drainage', 'Water appropriately', 'Check for root rot'],
      urgency: 'high',
      treatmentType: 'drainage'
    },
    yellowing: {
      treatments: ['nutrient analysis', 'adjust fertilization'],
      actions: ['Perform soil test', 'Apply appropriate fertilizer', 'Check irrigation'],
      urgency: 'medium',
      treatmentType: 'nutrient'
    },
    powdery: {
      treatments: ['sulfur or neem oil', 'reduce humidity'],
      actions: ['Spray with fungicide', 'Improve air movement', 'Remove affected leaves'],
      urgency: 'medium',
      treatmentType: 'fungicide'
    },
    canker: {
      treatments: ['prune infected branches', 'disinfect tools'],
      actions: ['Remove affected branches', 'Sterilize pruning tools', 'Apply wound dressing'],
      urgency: 'high',
      treatmentType: 'pruning'
    },
    healthy: {
      treatments: ['maintain current care regime'],
      actions: ['Continue regular monitoring', 'Maintain proper spacing', 'Regular inspection'],
      urgency: 'low',
      treatmentType: 'maintenance'
    }
  };

  /**
   * Generate recommendation based on detected disease
   * @param {string} diseaseName - Name of detected disease
   * @param {number} confidence - Confidence level (0-100)
   * @returns {Object} Recommendation object
   */
  static generateRecommendation(diseaseName, confidence) {
    const diseaseKey = this._findDiseaseKey(diseaseName.toLowerCase());
    const diseaseInfo = this.DISEASE_RECOMMENDATIONS[diseaseKey];

    if (!diseaseInfo) {
      return this._generateDefaultRecommendation(diseaseName, confidence);
    }

    // Mark as uncertain if confidence is below 70%
    const isUncertain = confidence < 70;

    const recommendation = {
      disease: diseaseName,
      confidence: confidence,
      treatments: diseaseInfo.treatments,
      actions: diseaseInfo.actions,
      urgency: isUncertain ? 'low' : diseaseInfo.urgency,
      treatmentType: diseaseInfo.treatmentType,
      recommendation: this._formatRecommendation(diseaseInfo, confidence),
      isUncertain: isUncertain,
      disclaimer: isUncertain ? 
        'Low confidence result. Recommend professional verification.' :
        undefined
    };

    return recommendation;
  }

  /**
   * Find matching disease key from predefined list
   * @private
   * @param {string} diseaseName - Disease name to search for
   * @returns {string} Matching disease key or 'default'
   */
  static _findDiseaseKey(diseaseName) {
    const name = diseaseName.toLowerCase();
    
    // Direct matches
    if (this.DISEASE_RECOMMENDATIONS[name]) {
      return name;
    }

    // Check for keywords
    const keywords = Object.keys(this.DISEASE_RECOMMENDATIONS);
    for (const keyword of keywords) {
      if (name.includes(keyword)) {
        return keyword;
      }
    }

    // Default case
    return 'default';
  }

  /**
   * Generate default recommendation for unknown disease
   * @private
   * @param {string} diseaseName - Disease name
   * @param {number} confidence - Confidence level
   * @returns {Object} Default recommendation
   */
  static _generateDefaultRecommendation(diseaseName, confidence) {
    return {
      disease: diseaseName,
      confidence: confidence,
      treatments: [
        'Consult agricultural extension officer or plant pathologist',
        'Document symptoms for expert analysis',
        'Isolate affected plants to prevent spread'
      ],
      actions: [
        'Take detailed photos of symptoms',
        'Document date and affected areas',
        'Contact local agricultural expert',
        'Implement quarantine measures if needed'
      ],
      urgency: confidence >= 80 ? 'high' : 'medium',
      treatmentType: 'expert_consultation',
      recommendation: `Unknown disease detected: "${diseaseName}". ${
        confidence >= 80 
          ? 'High confidence detection warrants expert consultation.' 
          : 'Low confidence - professional verification recommended.'
      } Document symptoms and contact an agricultural specialist.`,
      isUncertain: true,
      disclaimer: 'Unknown disease identified. Professional verification strongly recommended.'
    };
  }

  /**
   * Format recommendation as readable string
   * @private
   * @param {Object} diseaseInfo - Disease information object
   * @param {number} confidence - Confidence level
   * @returns {string} Formatted recommendation
   */
  static _formatRecommendation(diseaseInfo, confidence) {
    const treatments = diseaseInfo.treatments.join(', and ');
    const actions = diseaseInfo.actions.slice(0, 2).join(', and ');
    
    return `Use ${treatments}. ${actions}. Monitor closely over the next 7-14 days.`;
  }

  /**
   * Get urgency level based on confidence and disease type
   * @param {string} diseaseName - Disease name
   * @param {number} confidence - Confidence level
   * @returns {string} Urgency level (low, medium, high, critical)
   */
  static getUrgencyLevel(diseaseName, confidence) {
    if (confidence < 50) return 'low';
    if (confidence < 70) return 'medium';

    const diseaseKey = this._findDiseaseKey(diseaseName.toLowerCase());
    const diseaseInfo = this.DISEASE_RECOMMENDATIONS[diseaseKey];

    if (!diseaseInfo) return 'high';
    
    return diseaseInfo.urgency;
  }
}

module.exports = RecommendationEngine;
