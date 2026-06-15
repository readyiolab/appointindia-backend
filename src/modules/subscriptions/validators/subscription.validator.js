const { z } = require('zod');

const createSubscriptionSchema = z.object({
  recruiterId: z.string().uuid(),
  planId: z.string().uuid(),
});

module.exports = { createSubscriptionSchema };
