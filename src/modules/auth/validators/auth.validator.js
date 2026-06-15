const { z } = require('zod');

const authRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['candidate', 'recruiter', 'company_admin']).default('candidate'),
});

const authLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

module.exports = { authRegisterSchema, authLoginSchema };
