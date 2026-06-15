const { z } = require('zod');

const uploadResumeSchema = z.object({
  candidateId: z.string().uuid().optional(),
  fileName: z.string().min(1),
  s3Key: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().positive(),
  checksum: z.string().min(1).optional(),
});

module.exports = { uploadResumeSchema };
