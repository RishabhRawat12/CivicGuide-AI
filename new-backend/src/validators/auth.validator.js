const { z } = require('zod');

const loginSchema = z.object({
  idToken: z.string().min(1, 'Firebase ID token is required'),
});

const completeProfileSchema = z.object({
  age: z.number().min(17).max(120),
  state: z.string().min(2),
  constituency: z.string().optional(),
  voterStatus: z.enum(['registered', 'not_registered', 'applied', 'unknown']),
  hasVoterId: z.boolean().default(false),
  isFirstTimeVoter: z.boolean().optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid Indian Pincode (must be 6 digits)'),
});

const avatarSchema = z.object({
  image: z.string().min(10, 'Base64 image data is required'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']).optional().default('image/jpeg'),
});

module.exports = {
  loginSchema,
  completeProfileSchema,
  avatarSchema,
};
