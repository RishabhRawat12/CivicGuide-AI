const { z } = require('zod');

const sendMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().min(1).max(100).optional().default('default-session'),
});

module.exports = {
  sendMessageSchema,
};
