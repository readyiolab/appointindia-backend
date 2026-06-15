const { z } = require('zod');

const saveJobSchema = z.object({
  candidateId: z.string().uuid().optional(),
  jobId: z.string().uuid(),
});

module.exports = { saveJobSchema };
