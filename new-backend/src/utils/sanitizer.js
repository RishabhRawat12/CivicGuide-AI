const sanitizeResponse = (text) => {
  if (!text || typeof text !== 'string') {return text;}

  let cleaned = text.trim();
  
  // 1. Remove common AI "preamble" artifacts
  cleaned = cleaned
    .replace(/^(Certainly|Sure),?\s*here is (the|your) [^:]+:?\s*/i, '')
    .replace(/^(Certainly|Sure)!\s*here is (the|your) [^:]+:?\s*/i, '')
    .replace(/^Here is (the|your) [^:]+:?\s*/i, '')
    .replace(/^(Certainly|Sure)!\s*/i, '')
    .replace(/^(Certainly|Sure),?\s*/i, '');

  // 2. Strip Markdown Code Blocks (robustly)
  // Matches ```json ... ``` or just ``` ... ```
  cleaned = cleaned
    .replace(/^```[a-z]*\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return cleaned;
};

module.exports = { sanitizeResponse };
