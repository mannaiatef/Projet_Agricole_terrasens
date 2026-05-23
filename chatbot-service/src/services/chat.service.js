const { v4: uuidv4 } = require('uuid');
const llmService = require('./llm.service');
const toolExecutor = require('./tool-executor.service');
const conversationRepository = require('../repositories/conversation.repository');
const logger = require('../utils/logger');

class ChatService {
  async processUserMessage(userId, userMessage, token) {
    try {
      logger.info('Processing user message', { userId, messageLength: userMessage.length });

      // Get conversation history for context
      const history = await conversationRepository.getRecentHistory(userId, 10);

      // Convert history to format LLM can use
      const conversationHistory = history.map(msg => ({
        role: msg.userMessage ? 'user' : 'assistant',
        content: msg.userMessage || msg.botResponse,
      }));

      // Process message with LLM
      console.log('[ChatService] Calling LLM service...');
      let llmResponse;
      try {
        llmResponse = await llmService.processMessage(userMessage, conversationHistory);
      } catch (error) {
        console.error('[ChatService] LLM service failed:', error.message);
        logger.warn('LLM service failed, using fallback response', error.message);
        
        // Fallback response if LLM fails (better formatted)
        const fallbackResponses = [
          'I encountered a temporary issue with the AI service. However, I can still help! Based on your question about crop stress:\n\n🌾 **General Guidance:**\n- Check your crop calendar for optimal planting schedules\n- Monitor soil moisture regularly\n- Look for visual stress indicators (leaf discoloration, wilting)\n\nWhen the service is back online, I can:\n✓ Analyze real-time stress data from your parcels\n✓ Provide NDVI values and irrigation recommendations\n✓ Detect diseases from crop images\n✓ Generate detailed crop calendars\n\nPlease try again in a moment!',
          
          'I\'m currently experiencing API limitations, but your question was noted!\n\n💡 **What I can help with once reconnected:**\n- Parcel stress analysis (NDVI, vegetation indices)\n- Irrigation status and recommendations\n- Crop calendar and planting schedules\n- Disease detection from images\n\nYour message has been saved to the conversation history.',
          
          'The AI service is temporarily unavailable, but your farming operation continues! 🌾\n\nI can still:\n📊 Review saved conversation history\n💾 Store your questions for later analysis\n🔄 Retry when service is available\n\nPlease refresh the page and try again!'
        ];
        
        const response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        
        llmResponse = {
          success: false,
          response,
          toolsRequired: [],
          confidence: 0.3,
        };
      }

      if (!llmResponse.success && !llmResponse.response) {
        throw new Error('Failed to process message with LLM');
      }

      console.log('[ChatService] LLM response received, extracting tools...');

      // Extract and execute tools if needed
      let toolResults = [];
      const toolsUsed = [];

      if (llmResponse.toolsRequired && llmResponse.toolsRequired.length > 0) {
        logger.info('Tools required, executing...', { tools: llmResponse.toolsRequired });
        
        try {
          toolResults = await toolExecutor.executeMultipleTools(
            llmResponse.toolsRequired,
            token
          );

          for (const result of toolResults) {
            if (result.success) {
              toolsUsed.push(result.tool);
            }
          }
        } catch (error) {
          logger.warn('Error executing tools, continuing with LLM response only', error.message);
          // Continue without tool results - LLM can still provide useful response
        }
      }

      // Enhance response with tool results
      let finalResponse = llmResponse.response;
      if (toolResults.length > 0) {
        const successfulResults = toolResults.filter(r => r.success);
        if (successfulResults.length > 0) {
          finalResponse += '\n\n📊 Data Summary:\n';
          for (const result of successfulResults) {
            finalResponse += `\n${result.summary}\n`;
          }
        } else {
          // If no tools succeeded, add a note
          const failedTools = toolResults.filter(r => !r.success);
          if (failedTools.length > 0) {
            logger.warn('All tool executions failed', { failedTools });
            finalResponse += '\n\n⚠️ Note: Could not fetch real-time data from services. The above response is based on general knowledge.';
          }
        }
      }

      // Save conversation
      const conversation = await conversationRepository.saveConversation({
        userId,
        userMessage,
        botResponse: finalResponse,
        toolsUsed,
        confidence: llmResponse.confidence,
        metadata: {
          toolResults: toolResults.filter(r => r.success).map(r => ({
            tool: r.tool,
            timestamp: new Date().toISOString(),
          })),
        },
      });

      return {
        success: true,
        conversationId: conversation.id,
        response: finalResponse,
        toolsUsed,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error processing user message', error);
      throw error;
    }
  }

  async processImageUpload(userId, imagePath, parcelleId, token) {
    try {
      logger.info('Processing image upload', { userId, imagePath, parcelleId });

      // Execute disease detection
      let diseaseResult;
      try {
        diseaseResult = await toolExecutor.detectDisease(imagePath, token);
      } catch (error) {
        logger.warn('Disease detection failed', error.message);
        diseaseResult = {
          success: false,
          summary: `Unable to analyze image: ${error.message}. Please ensure the disease detection service is running.`,
          data: null
        };
      }

      // Generate AI recommendations based on detection
      let recommendations = diseaseResult.summary;
      
      if (diseaseResult.success) {
        try {
          recommendations = await llmService.generateImageAnalysisPrompt(diseaseResult.data);
        } catch (error) {
          logger.warn('Error generating AI recommendations', error.message);
          recommendations = diseaseResult.summary;
        }
      }

      // Create user message for the upload
      const userMessage = `🌾 Image Analysis: Analyzing crop image${parcelleId ? ` for parcel ${parcelleId}` : ''}`;

      // Save conversation
      const conversation = await conversationRepository.saveConversation({
        userId,
        userMessage,
        botResponse: recommendations,
        toolsUsed: diseaseResult.success ? ['detectDisease'] : [],
        confidence: diseaseResult.data?.prediction?.confidence || 0.5,
        metadata: {
          imageFile: imagePath,
          parcelleId,
          diseaseDetectionData: diseaseResult.data,
          diseaseDetectionSuccess: diseaseResult.success,
        },
      });

      return {
        success: true,
        conversationId: conversation.id,
        analysis: diseaseResult.summary,
        recommendations,
        diseaseData: diseaseResult.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error processing image upload', error);
      throw error;
    }
  }

  async getConversationHistory(userId, limit = 50, offset = 0) {
    try {
      logger.info('Fetching conversation history', { userId, limit, offset });

      const conversations = await conversationRepository.getHistory(userId, limit, offset);
      const total = await conversationRepository.getHistoryCount(userId);

      return {
        success: true,
        data: conversations,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching conversation history', error);
      throw error;
    }
  }

  async clearConversationHistory(userId) {
    try {
      logger.info('Clearing conversation history', { userId });

      await conversationRepository.clearHistory(userId);

      return {
        success: true,
        message: 'Conversation history cleared',
      };
    } catch (error) {
      logger.error('Error clearing conversation history', error);
      throw error;
    }
  }
}

module.exports = new ChatService();
