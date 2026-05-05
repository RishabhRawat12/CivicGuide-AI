const { z } = require('zod');

/**
 * CivicGuide AI Prompt Service (Hardened Edition)
 * Centralized templates for educational features.
 * Implements input sanitization to prevent prompt injection.
 */

/**
 * Sanitizes user input for use in LLM prompts.
 * Strips potential injection markers and limits length.
 */
const sanitizeForPrompt = (text, maxLength = 500) => {
  if (!text || typeof text !== 'string') {return '';}

  return text
    .substring(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML/System tags
    .replace(/\[\[.*?\]\]/g, '') // Remove potential system instruction markers
    .replace(/(ignore|system|instruction|bypass|secret)/gi, '[REDACTED]') // Basic injection word filtering
    .trim();
};

const SYSTEM_INSTRUCTION = `You are CivicGuide AI, a premium and friendly Indian civic education assistant.
Your goal is to transform complex electoral procedures into an interactive, step-by-step journey for laypeople.

STRICT RULES:
1. Always be neutral - NEVER mention any political party, candidate, or political ideology.
2. Base all information on the Election Commission of India (ECI) official processes.
3. Give step-by-step, actionable guidance that a beginner can follow.
4. Use simple language. You can use Hinglish (mix of Hindi and English) where natural and appropriate.
5. Always end with "What should you do next?" or "👉 Next Step:" followed by a clear next action.
6. Be encouraging and supportive about civic participation.
7. Focus on WHAT the user should DO, not just information.
8. Keep responses concise but complete.
9. When generating JSON, include a "reasoning" field explaining WHY this recommendation is personalized.
10. Include a "confidenceScore" (0-100) indicating how confident you are in the recommendation.
11. When citing official links, ALWAYS use: 
    - Voter Portal: https://voters.eci.gov.in/
    - Electoral Search: https://electoralsearch.eci.gov.in/
    - ECI Main: https://eci.gov.in/`;

const prompts = {
  journey: (user) => ({
    system: SYSTEM_INSTRUCTION,
    prompt: `Generate a personalized voting journey for this Indian voter:
- Name: ${sanitizeForPrompt(user.name, 50)}
- Age: ${user.age}
- State: ${sanitizeForPrompt(user.state, 50)}
- Voter Registration Status: ${user.voterStatus || 'unknown'}
- Has Voter ID: ${user.hasVoterId ? 'Yes' : 'No'}
- First Time Voter: ${user.isFirstTimeVoter ? 'Yes' : 'No'}
- Pincode: ${sanitizeForPrompt(user.pincode, 10) || 'Not provided'}

Create a step-by-step journey with exactly 5-7 steps. 
For each step include title, description, official resource link, and estimated time.
Reasoning must explain why these steps were chosen based on their specific age and registration status.`,
    schema: z.object({
      steps: z.array(z.object({
        number: z.number(),
        title: z.string(),
        description: z.string(),
        resource: z.string().url(),
        estimatedTime: z.string(),
      })),
      summary: z.string(),
      nextAction: z.string(),
      reasoning: z.string(),
      confidenceScore: z.number().min(0).max(100),
    }),
  }),

  readiness: (user, checklist = []) => ({
    system: SYSTEM_INSTRUCTION,
    prompt: `Calculate the voting readiness score (0-100) for this Indian voter:

Voter Profile:
- Age: ${user.age}
- State: ${sanitizeForPrompt(user.state, 50)}
- Voter Status: ${user.voterStatus}
- Has Voter ID: ${user.hasVoterId}
- First Time Voter: ${user.isFirstTimeVoter}

Checklist Status:
${checklist.map(item => `- ${sanitizeForPrompt(item.label, 100)}: ${item.completed ? '✅ Done' : '❌ Not done'}`).join('\n')}

Break down the score into registration, documents, and awareness. Provide tips for improvement.`,
    schema: z.object({
      score: z.number().min(0).max(100),
      breakdown: z.object({
        registration: z.object({ score: z.number(), status: z.string() }),
        documents: z.object({ score: z.number(), status: z.string() }),
        awareness: z.object({ score: z.number(), status: z.string() }),
      }),
      tips: z.array(z.string()),
      nextAction: z.string(),
      reasoning: z.string(),
      confidenceScore: z.number().min(0).max(100),
    }),
  }),

  chat: (message, user, chatHistory = []) => ({
    system: `${SYSTEM_INSTRUCTION}

VOTER CONTEXT:
- Name: ${sanitizeForPrompt(user.name, 50)} | Age: ${user.age} | State: ${sanitizeForPrompt(user.state, 50)}
- Registration: ${user.voterStatus} | Has Voter ID: ${user.hasVoterId}
- First-Time Voter: ${user.isFirstTimeVoter || false}

CONVERSATION SO FAR:
${chatHistory.slice(-8).map(m => `${m.role === 'user' ? 'VOTER' : 'AI'}: ${sanitizeForPrompt(m.content, 500)}`).join('\n')}

MESSAGE CLASSIFICATION:
A) **GREETING ONLY**
B) **ELECTION-RELATED**

FOR CATEGORY A: Respond with a friendly welcome.
FOR CATEGORY B: Answer the question DIRECTLY using ECI data.`,
    prompt: sanitizeForPrompt(message, 1000),
  }),

  scenario: (scenarioType, user) => ({
    system: SYSTEM_INSTRUCTION,
    prompt: `Simulate this Indian voter scenario:
Scenario Type: ${sanitizeForPrompt(scenarioType, 50)}
Voter: ${sanitizeForPrompt(user.name, 50)}, Age ${user.age}, from ${sanitizeForPrompt(user.state, 50)}

Provide a detailed solution flow with steps, documents needed, and expected timeline.`,
    schema: z.object({
      title: z.string(),
      description: z.string(),
      steps: z.array(z.object({
        number: z.number(),
        action: z.string(),
        details: z.string(),
        link: z.string().url().optional(),
      })),
      documentsNeeded: z.array(z.string()),
      estimatedTime: z.string(),
      nextAction: z.string(),
      helplineNumber: z.string().default('1950'),
    }),
  }),

  quiz: (user, history = []) => ({
    system: SYSTEM_INSTRUCTION,
    prompt: `Generate a 3-question civic education quiz for this voter:
- Age: ${user.age}
- State: ${user.state}
- Voter Status: ${user.voterStatus}

Context from recent chat:
${history.slice(-3).map(m => m.content).join('\n')}

Questions should be multiple-choice with 4 options each.
Include a "didYouKnow" fact for each question.`,
    schema: z.object({
      questions: z.array(z.object({
        question: z.string(),
        options: z.array(z.string()),
        correctAnswer: z.number(), // index 0-3
        explanation: z.string(),
        didYouKnow: z.string(),
      })),
      summary: z.string(),
    }),
  }),

  timeline: (user) => ({
    system: SYSTEM_INSTRUCTION,
    prompt: `Generate a chronological timeline of key electoral dates and milestones for this voter:
- State: ${user.state}
- Registration Status: ${user.voterStatus}

Include registration deadlines, polling dates (approximate), and result dates.`,
    schema: z.object({
      events: z.array(z.object({
        date: z.string(),
        title: z.string(),
        description: z.string(),
        importance: z.enum(['high', 'medium', 'low']),
      })),
      summary: z.string(),
    }),
  }),
};

module.exports = prompts;
