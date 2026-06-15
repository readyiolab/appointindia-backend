const { z } = require('zod');

const createJobSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  companyId: z.string().uuid().optional(),
  recruiterId: z.string().uuid().optional(),
  companyName: z.string().min(2).optional(),
  location: z.string().min(2),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  jobType: z.enum(['full_time', 'part_time', 'contract', 'internship', 'freelance']),
  workMode: z.enum(['remote', 'hybrid', 'onsite']),
  minSalary: z.number().optional(),
  maxSalary: z.number().optional(),
  minExperienceYears: z.number().int().nonnegative().optional(),
  maxExperienceYears: z.number().int().nonnegative().optional(),
  expiresAt: z.string().datetime(),
});

const updateJobSchema = createJobSchema.partial();

const searchJobSchema = z.object({
  location: z.string().optional(),
  jobType: z.enum(['full_time', 'part_time', 'contract', 'internship', 'freelance']).optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
});

module.exports = { createJobSchema, updateJobSchema, searchJobSchema };
