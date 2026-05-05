/**
 * @fileoverview Chat Controller — handles AI chat interactions
 * @module api/controllers/chat
 */
const chatService = require('../../services/business/ChatService');
const { asyncHandler } = require('../../utils/asyncHandler');
const winston = require('winston');

/**
 * Process a user chat message through the AI pipeline.
 * @route POST /api/chat
 * @param {Object} req.body
 * @param {string} req.body.message - User's chat message
 * @param {string} req.body.sessionId - Chat session identifier
 * @returns {{ success: boolean, data: { reply: string, sentiment: Object, metadata: Object } }}
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { message, sessionId } = req.body;
  const { uid } = req.user; // Identity exclusively from JWT/Cookie

  if (!message || message.length > 2000) {
    return res.status(400).json({ success: false, error: 'Message missing or exceeds character limit' });
  }

  const response = await chatService.handleUserMessage(uid, sessionId, message);

  res.json({
    success: true,
    data: {
      reply: response.content,
      sentiment: {
        label: response.metadata?.sentiment || 'neutral',
        score: response.metadata?.sentimentScore || 0,
      },
      metadata: response.metadata,
    },
  });
});

/**
 * Retrieve chat history for a session.
 * @route GET /api/chat/history/:sessionId
 * @param {string} req.params.sessionId - Chat session identifier
 * @returns {{ success: boolean, data: Array<{ role: string, content: string }> }}
 */
const getHistory = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { uid } = req.user;

  const history = await chatService.getChatHistory(uid, sessionId);
  res.json({ success: true, data: history });
});

module.exports = { sendMessage, getHistory };
