const chatService = require('../services/chat.service');
const logger = require('../utils/logger');

class ChatController {
  async sendMessage(req, res) {
    try {
      console.log('[ChatController] sendMessage called');
      const { message, parcelleId } = req.body;
      const userId = req.userId;
      const token = req.headers.authorization?.split(' ')[1];

      console.log('[ChatController] Message received:', { message: message?.substring(0, 50), parcelleId, userId });

      if (!message || message.trim().length === 0) {
        console.log('[ChatController] Empty message rejected');
        return res.status(400).json({
          success: false,
          message: 'Message cannot be empty',
        });
      }

      if (message.length > 5000) {
        console.log('[ChatController] Message too long rejected');
        return res.status(400).json({
          success: false,
          message: 'Message is too long (max 5000 characters)',
        });
      }

      console.log('[ChatController] Calling chatService.processUserMessage');
      const result = await chatService.processUserMessage(userId, message, token);

      console.log('[ChatController] Response generated successfully');
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('[ChatController] Error in sendMessage:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to process message',
      });
    }
  }

  async uploadImage(req, res) {
    try {
      const userId = req.userId;
      const token = req.headers.authorization?.split(' ')[1];
      const { parcelleId } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided',
        });
      }

      const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedMimes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Only JPEG and PNG images are allowed',
        });
      }

      const maxSize = 25 * 1024 * 1024; // 25MB
      if (req.file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: 'Image file is too large (max 25MB)',
        });
      }

      const result = await chatService.processImageUpload(
        userId,
        req.file.path,
        parcelleId,
        token
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error in uploadImage', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to process image',
      });
    }
  }

  async getHistory(req, res) {
    try {
      console.log('[ChatController] getHistory called');
      const userId = req.userId;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      console.log('[ChatController] Getting history for:', { userId, limit, offset });

      if (limit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limit cannot exceed 100',
        });
      }

      const result = await chatService.getConversationHistory(userId, limit, offset);
      
      // result already has { success, data: conversations[], pagination }
      console.log('[ChatController] History retrieved:', { 
        count: result.data?.length, 
        userId,
        pagination: result.pagination
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('[ChatController] Error in getHistory:', error.message);
      logger.error('Error in getHistory', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch history',
      });
    }
  }

  async clearHistory(req, res) {
    try {
      const userId = req.userId;

      const result = await chatService.clearConversationHistory(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Error in clearHistory', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to clear history',
      });
    }
  }

  async health(req, res) {
    res.status(200).json({
      success: true,
      message: 'Chat Service is healthy',
    });
  }
}

module.exports = new ChatController();
