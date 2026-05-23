const { DataTypes } = require('sequelize');
const { getDatabase } = require('../config/db');

let Conversation;

const initializeConversationModel = () => {
  const sequelize = getDatabase();

  Conversation = sequelize.define('Conversation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      index: true,
    },
    userMessage: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    botResponse: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    toolsUsed: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Array of tools called for this interaction',
    },
    confidence: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: 'Confidence score of the LLM response',
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Additional metadata about the interaction',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    timestamps: true,
    tableName: 'conversations',
  });

  return Conversation;
};

const getConversationModel = () => {
  if (!Conversation) {
    Conversation = initializeConversationModel();
  }
  return Conversation;
};

// Initialize when db.js loads
try {
  getConversationModel();
} catch (error) {
  // Model will be initialized when database is ready
}

module.exports = {
  getConversationModel,
  initializeConversationModel,
};
