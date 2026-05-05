/**
 * @fileoverview Civic Validators
 */
const { z } = require('zod');

const boothGuidanceSchema = z.object({
  pincode: z.string().length(6, 'Pincode must be exactly 6 digits').regex(/^\d+$/, 'Pincode must contain only digits').optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
}).refine(data => data.pincode || data.location, {
  message: 'Either pincode or location must be provided',
});

const updateChecklistSchema = z.object({
  items: z.array(z.object({
    key: z.string(),
    label: z.string(),
    completed: z.boolean(),
    completedAt: z.string().datetime().nullable().optional(),
  })),
});

const saveQuizResultSchema = z.object({
  score: z.number().min(0),
  totalQuestions: z.number().min(1),
  correctAnswers: z.number().min(0),
  category: z.string().optional(),
});

const translateSchema = z.object({
  text: z.string().min(1).max(1000),
  targetLanguage: z.string().min(2).max(50),
});

module.exports = {
  boothGuidanceSchema,
  updateChecklistSchema,
  saveQuizResultSchema,
  translateSchema,
};
