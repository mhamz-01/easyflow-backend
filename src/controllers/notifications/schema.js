const z = require("zod");

const listNotificationsQuerySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

module.exports = { listNotificationsQuerySchema };
