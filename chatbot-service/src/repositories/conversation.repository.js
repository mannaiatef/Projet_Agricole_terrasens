const { getConversationModel } = require('../models/Conversation');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class ConversationRepository {
  async saveConversation(data) {
    try {
      const Conversation = getConversationModel();

      const conversation = await Conversation.create({
        userId: data.userId,
        userMessage: data.userMessage,
        botResponse: data.botResponse,
        toolsUsed: data.toolsUsed || [],
        confidence: data.confidence || 0,
        metadata: data.metadata || {},
      });

      logger.info('Conversation saved', { id: conversation.id, userId: data.userId });
      return conversation;
    } catch (error) {
      logger.error('Error saving conversation', error);
      throw error;
    }
  }

  async getHistory(userId, limit = 50, offset = 0) {
    try {
      const Conversation = getConversationModel();

      const conversations = await Conversation.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        attributes: ['id', 'userMessage', 'botResponse', 'toolsUsed', 'confidence', 'createdAt'],
      });

      return conversations;
    } catch (error) {
      logger.error('Error fetching conversation history', error);
      throw error;
    }
  }

  async getRecentHistory(userId, limit = 10) {
    try {
      const Conversation = getConversationModel();

      const conversations = await Conversation.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit,
        attributes: ['id', 'userMessage', 'botResponse', 'createdAt'],
      });

      // Return in chronological order
      return conversations.reverse();
    } catch (error) {
      logger.error('Error fetching recent conversation history', error);
      throw error;
    }
  }

  async getHistoryCount(userId) {
    try {
      const Conversation = getConversationModel();

      const count = await Conversation.count({
        where: { userId },
      });

      return count;
    } catch (error) {
      logger.error('Error counting conversations', error);
      throw error;
    }
  }

  async getConversationById(id) {
    try {
      const Conversation = getConversationModel();

      const conversation = await Conversation.findByPk(id);
      return conversation;
    } catch (error) {
      logger.error('Error fetching conversation', error);
      throw error;
    }
  }

  async clearHistory(userId) {
    try {
      const Conversation = getConversationModel();

      const result = await Conversation.destroy({
        where: { userId },
      });

      logger.info('Conversation history cleared', { userId, count: result });
      return result;
    } catch (error) {
      logger.error('Error clearing conversation history', error);
      throw error;
    }
  }

  async deleteConversation(id, userId) {
    try {
      const Conversation = getConversationModel();

      const result = await Conversation.destroy({
        where: {
          id,
          userId,
        },
      });

      logger.info('Conversation deleted', { id, userId });
      return result;
    } catch (error) {
      logger.error('Error deleting conversation', error);
      throw error;
    }
  }

  async searchConversations(userId, searchTerm) {
    try {
      const Conversation = getConversationModel();

      const conversations = await Conversation.findAll({
        where: {
          userId,
          [Op.or]: [
            { userMessage: { [Op.like]: `%${searchTerm}%` } },
            { botResponse: { [Op.like]: `%${searchTerm}%` } },
          ],
        },
        order: [['createdAt', 'DESC']],
      });

      return conversations;
    } catch (error) {
      logger.error('Error searching conversations', error);
      throw error;
    }
  }
}

module.exports = new ConversationRepository();
