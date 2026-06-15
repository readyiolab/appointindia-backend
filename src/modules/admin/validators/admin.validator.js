const { z } = require('zod');

const updateUserStatusSchema = z.object({
  status: z.enum(['pending', 'active', 'suspended', 'locked']),
});

module.exports = { updateUserStatusSchema };
