const axios = require('axios');
const logger = require('../utils/logger');

class LLMService {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = 'mistral'; // Using Mistral model in Ollama
    this.modelWarmedUp = false;

    console.log(`[LLMService] Configured to use Ollama at ${this.ollamaUrl} with model: ${this.model}`);

    // Define available tools
    this.tools = [
      {
        name: 'getStress',
        description: 'Get plant stress analysis for a specific parcel',
        parameters: {
          type: 'object',
          properties: {
            parcelleId: {
              type: 'string',
              description: 'The ID of the parcel/field',
            },
          },
          required: ['parcelleId'],
        },
      },
      {
        name: 'getIrrigationStatus',
        description: 'Get irrigation status and recommendations for a parcel',
        parameters: {
          type: 'object',
          properties: {
            parcelleId: {
              type: 'string',
              description: 'The ID of the parcel/field',
            },
          },
          required: ['parcelleId'],
        },
      },
      {
        name: 'getCropCalendar',
        description: 'Get crop calendar and planting schedule for a parcel',
        parameters: {
          type: 'object',
          properties: {
            parcelleId: {
              type: 'string',
              description: 'The ID of the parcel/field',
            },
          },
          required: ['parcelleId'],
        },
      },
      {
        name: 'detectDisease',
        description: 'Detect plant diseases from an uploaded image',
        parameters: {
          type: 'object',
          properties: {
            imagePath: {
              type: 'string',
              description: 'Path to the uploaded image file',
            },
          },
          required: ['imagePath'],
        },
      },
    ];
  }

  async warmupModel() {
    if (this.modelWarmedUp) return;
    
    try {
      console.log('[LLMService] Pre-loading model into memory...');
      const startTime = Date.now();
      
      await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.model,
        prompt: 'Hi',
        stream: false,
        temperature: 0.7,
      }, {
        timeout: 120000, // 2 minutes for first load
      });
      
      const loadTime = Date.now() - startTime;
      console.log(`[LLMService] ✅ Model warmed up successfully in ${loadTime}ms`);
      this.modelWarmedUp = true;
    } catch (error) {
      console.warn('[LLMService] ⚠️ Model warm-up failed:', error.message);
      // Don't throw - continue anyway
    }
  }

  async processMessage(userMessage, conversationHistory = []) {
    try {
      console.log('[LLMService] processMessage called');
      logger.info('Processing message with LLM', { userMessage });

      // Build conversation context
      const messages = [
        ...conversationHistory,
        {
          role: 'user',
          content: userMessage,
        },
      ];

      const systemPrompt = `You are an intelligent agricultural assistant for TerraSens, a smart agriculture platform.
You help farmers with their crops and fields. You have access to several tools:
- getStress: To get plant stress analysis (ET0, NDVI, stress level)
- getIrrigationStatus: To get irrigation status and recommendations
- getCropCalendar: To get crop calendar information
- detectDisease: To detect plant diseases from images

CRITICAL RULES FOR TOOL CALLING:
1. When you need data, ALWAYS call the appropriate tool in this format:
   CALL getStress(parcelleId: <ID>)
   CALL getIrrigationStatus(parcelleId: <ID>)
   CALL getCropCalendar(parcelleId: <ID>)

2. NEVER generate placeholder or fictional values like [value], [data], [actual_stage], etc.
3. NEVER include fake numbers or data before calling tools.
4. ONLY provide information AFTER the tool has been called and data is provided.
5. If tool returns N/A or no data, acknowledge this to the user.

CORRECT WORKFLOW:
- User: "Analyser stress parcelle 30"
- You: "I will analyze the stress for parcel 30. CALL getStress(parcelleId: 30)"
- Tool returns real data
- You provide recommendations based on REAL data only

WRONG WORKFLOW (DO NOT DO THIS):
- You: "The stress is [fake_value] for parcel 30. CALL getStress(...)"  ← WRONG!
- You: "[ET0: 1.2 mm] [NDVI: 0.57]" ← NEVER generate fake data!

Language: Respond in the same language as user (French, English, Arabic).
Be helpful, professional, agricultural-focused.
ALWAYS use real data only, NEVER make up values.`;

      console.log('[LLMService] Calling Ollama/Mistral API...');
      
      try {
        console.log('[LLMService] Attempting to connect to Ollama using /api/generate...');
        
        // Build the prompt in a chat-like format
        const prompt = `${systemPrompt}\n\nUser: ${userMessage}\n\nAssistant:`;
        
        const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
          model: this.model,
          prompt: prompt,
          stream: false,
          temperature: 0.7,
        }, {
          timeout: 120000, // 2 minutes max (increased for slow systems)
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('[LLMService] Ollama response received successfully');
        const assistantMessage = response.data.response || '';

        return {
          success: true,
          response: assistantMessage.trim(),
          toolsRequired: this.extractToolCalls(assistantMessage),
          confidence: 0.85,
        };
      } catch (ollamaError) {
        console.error('[LLMService] Ollama Error:', ollamaError.message);
        logger.error('Error with Ollama API', ollamaError);
        
        // Check if Ollama is not available
        if (ollamaError.code === 'ECONNREFUSED' || ollamaError.message.includes('ECONNREFUSED') || ollamaError.message.includes('timeout')) {
          console.warn('[LLMService] Ollama service timeout/unavailable, using fallback response');
          const fallbackResponse = this.getFallbackResponse(userMessage);
          return {
            success: false,
            response: fallbackResponse,
            toolsRequired: [],
            confidence: 0.3,
          };
        }
        
        throw ollamaError;
      }
    } catch (error) {
      console.error('[LLMService] Error:', error.message);
      logger.error('Error processing message with LLM', error);
      
      // Return fallback response instead of throwing
      const fallbackResponse = this.getFallbackResponse(userMessage);
      return {
        success: false,
        response: fallbackResponse,
        toolsRequired: [],
        confidence: 0.3,
      };
    }
  }

  getFallbackResponse(userMessage) {
    const fallbackResponses = [
      'Je suis désolé, j\'ai rencontré un problème temporaire. Cependant, je peux vous aider! Basé sur votre question sur la gestion agricole:\n\n🌾 **Conseils Généraux:**\n- Consultez votre calendrier des cultures pour les calendriers de plantation optimaux\n- Surveillez régulièrement l\'humidité du sol\n- Recherchez des indicateurs visuels de stress (décoloration des feuilles, flétrissement)\n\nDès que le service est de retour, je peux:\n✓ Analyser les données de stress en temps réel\n✓ Fournir les recommandations NDVI et d\'irrigation\n✓ Détecter les maladies des images des cultures\n✓ Générer des calendriers détaillés\n\nVeuillez réessayer dans un instant!',
      
      'I\'m experiencing temporary connectivity issues, but your question was noted!\n\n💡 **What I can help with once reconnected:**\n- Parcel stress analysis (NDVI, vegetation indices)\n- Irrigation status and recommendations\n- Crop calendar and planting schedules\n- Disease detection from images\n\nYour message has been saved to the conversation history.',
      
      'خدمة الذكاء الاصطناعي غير متاحة مؤقتًا، لكن عملياتك الزراعية تستمر! 🌾\n\nأستطيع:\n📊 مراجعة سجل المحادثات المحفوظ\n💾 تخزين أسئلتك للتحليل لاحقًا\n🔄 إعادة المحاولة عند توفر الخدمة\n\nالرجاء تحديث الصفحة والمحاولة مجددًا!',
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }

  extractToolCalls(response) {
    // Extract tools using the new CALL format: CALL toolName(param: value, ...)
    const toolCalls = [];
    
    // Pattern to match: CALL getStress(parcelleId: 30) or CALL getStress(parcelleId:30)
    const callPattern = /CALL\s+(\w+)\s*\((.*?)\)/g;
    let match;
    
    while ((match = callPattern.exec(response)) !== null) {
      const toolName = match[1];
      const paramsString = match[2];
      
      // Validate tool name
      const validTools = ['getStress', 'getIrrigationStatus', 'getCropCalendar', 'detectDisease'];
      if (validTools.includes(toolName)) {
        const params = this.parseToolParams(paramsString);
        toolCalls.push({
          name: toolName,
          params: params,
        });
        console.log(`[LLMService] Extracted tool call: ${toolName}`, params);
      }
    }

    return toolCalls;
  }

  parseToolParams(paramsString) {
    // Parse format like: "parcelleId: 30" or "parcelleId:30" or "imagePath: /path/to/image"
    const params = {};
    
    // Split by comma for multiple parameters
    const pairs = paramsString.split(',');
    
    for (const pair of pairs) {
      // Split by colon and trim spaces
      const colonIndex = pair.indexOf(':');
      if (colonIndex > -1) {
        const key = pair.substring(0, colonIndex).trim();
        let value = pair.substring(colonIndex + 1).trim();
        
        // Remove quotes if present
        value = value.replace(/^["']|["']$/g, '');
        
        if (key && value) {
          params[key] = value;
        }
      }
    }
    
    console.log('[LLMService] Parsed tool params:', params);
    return params;
  }

  async generateImageAnalysisPrompt(diseaseDetectionResult) {
    try {
      const prompt = `Based on this disease detection result: ${JSON.stringify(diseaseDetectionResult)}, 
provide a detailed recommendation for the farmer including treatment options and preventive measures.`;

      const response = await axios.post(`${this.ollamaUrl}/api/chat`, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an agricultural disease expert. Provide treatment and prevention recommendations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false,
      }, {
        timeout: 15000,
      });

      return response.data.message?.content || response.data.response || 'Unable to generate analysis';
    } catch (error) {
      logger.error('Error generating image analysis prompt', error);
      return 'Unable to generate analysis at this time. Please try again later.';
    }
  }

  getToolDefinitions() {
    return this.tools;
  }
}

module.exports = new LLMService();
