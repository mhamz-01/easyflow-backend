const z = require("zod");

const sendMessageSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty").max(2000),
});

const getMessagesQuerySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

module.exports = { sendMessageSchema, getMessagesQuerySchema };
