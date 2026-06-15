const { z } = require('zod');

const createRecruiterSchema = z.object({
  companyId: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  designation: z.string().min(1),
  phone: z.string().optional(),
});

const updateRecruiterSchema = createRecruiterSchema.partial();

module.exports = { createRecruiterSchema, updateRecruiterSchema };
