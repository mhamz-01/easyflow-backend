const z = require("zod");

// Denormalized snapshot of the shared resource, captured at send time —
// projectId is included (not just id/title) so a task card — which has no
// direct URL — knows which project's task drawer to open.
const attachmentSchema = z.object({
  type: z.enum(["task", "document", "whiteboard"]),
  id: z.number().int().positive(),
  title: z.string().trim().min(1).max(300),
  projectId: z.number().int().positive(),
});

// projectId absent => General channel; present => that project's channel.
const sendMessageSchema = z
  .object({
    projectId: z.coerce.number().int().positive().optional(),
    content: z.string().trim().max(2000).optional(),
    attachment: attachmentSchema.optional(),
  })
  .refine((data) => (data.content && data.content.length > 0) || data.attachment, {
    message: "Message must include text or an attachment",
    path: ["content"],
  });

const getMessagesQuerySchema = z.object({
  projectId: z.coerce.number().int().positive().optional(),
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

module.exports = { attachmentSchema, sendMessageSchema, getMessagesQuerySchema };
