const { z } = require('zod');

const updateCandidateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  headline: z.string().optional(),
  currentLocation: z.string().optional(),
  preferredLocation: z.string().optional(),
  totalExperienceYears: z.number().int().nonnegative().optional(),
  currentSalary: z.number().optional(),
  expectedSalary: z.number().optional(),
  summary: z.string().optional(),
});

module.exports = { updateCandidateSchema };
