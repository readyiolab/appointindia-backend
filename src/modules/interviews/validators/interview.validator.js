const { z } = require('zod');

const scheduleInterviewSchema = z.object({
  applicationId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  mode: z.enum(['online', 'offline']).default('online'),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const updateInterviewSchema = z.object({
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
  notes: z.string().optional(),
});

module.exports = { scheduleInterviewSchema, updateInterviewSchema };
