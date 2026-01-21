const { z } = require("zod");

const clerkUserSchema = z.object({
  type: z.string(),
  data: z.object({
    id: z.string(),
    username: z.string().nullable(),
    first_name: z.string().nullable(),
    image_url: z.string().nullable(),
    email_addresses: z.array(
      z.object({
        email_address: z.string().email(),
      })
    ),
  }),
});

module.exports = {
  clerkUserSchema,
};
