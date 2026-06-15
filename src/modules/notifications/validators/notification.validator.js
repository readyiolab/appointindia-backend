const { z } = require('zod');

const markReadSchema = z.object({
  isRead: z.boolean().optional(),
});

module.exports = { markReadSchema };
