const { z } = require('zod');

const createApplicationSchema = z.object({
  jobId: z.string().uuid(),
  candidateId: z.string().uuid().optional(),
  resumeId: z.string().uuid().optional(),
});

const updateApplicationStatusSchema = z.object({
  status: z.enum(['applied', 'screening', 'shortlisted', 'interview_scheduled', 'rejected', 'hired']),
});

const recruiterPipelineQuerySchema = z.object({
  jobId: z.string().uuid().optional(),
  status: z
    .enum(['applied', 'screening', 'shortlisted', 'interview_scheduled', 'rejected', 'hired'])
    .optional(),
  workMode: z.enum(['remote', 'hybrid', 'onsite']).optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

module.exports = {
  createApplicationSchema,
  updateApplicationStatusSchema,
  recruiterPipelineQuerySchema,
};
