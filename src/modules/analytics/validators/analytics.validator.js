const { z } = require('zod');

const analyticsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

module.exports = { analyticsQuerySchema };
