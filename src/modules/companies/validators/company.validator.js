const { z } = require('zod');

const createCompanySchema = z.object({
  name: z.string().min(2),
  website: z.string().url().optional(),
  industry: z.string().min(2),
  size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']),
  location: z.string().min(2),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
});

const updateCompanySchema = createCompanySchema.partial();

module.exports = { createCompanySchema, updateCompanySchema };
