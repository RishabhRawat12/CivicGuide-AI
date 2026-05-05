const { z } = require('zod');

/**
 * Ensures analytics payloads strictly match the BigQuery table schema
 * to prevent Pub/Sub BigQuery Subscription rejections.
 */
const analyticsEventSchema = z.object({
  userId: z.string(),
  eventType: z.enum([
    'chat_query', 'chat_processed', 'profile_update', 'quiz_submission',
    'scenario_simulation', 'journey_generated', 'readiness_checked',
    'checklist_updated', 'booth_searched', 'translation_requested',
  ]),
  timestamp: z.string().datetime(),
  payload: z.object({
    query: z.string().optional(),
    sentiment: z.string().optional(),
    sentimentScore: z.number().optional(),
    responseTimeMs: z.number().optional(),
    provider: z.string().optional(),
    success: z.boolean(),
    errorCode: z.string().optional(),
  }),
  metadata: z.record(z.string(), z.any()).optional(),
});

module.exports = {
  analyticsEventSchema,
};
