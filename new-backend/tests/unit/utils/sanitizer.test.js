const { sanitizeResponse } = require('../../../src/utils/sanitizer');

describe('Sanitizer Utility', () => {
  it('should remove common AI preamble artifacts', () => {
    const inputs = [
      'Certainly! Here is your voter registration guide: \n1. Fill form',
      'Here is the information you requested: Delhi elections are on...',
      'Sure, here is the roadmap: Follow these steps'
    ];

    expect(sanitizeResponse(inputs[0])).not.toContain('Certainly!');
    expect(sanitizeResponse(inputs[0])).not.toContain('Here is your');
    expect(sanitizeResponse(inputs[1])).not.toContain('Here is the');
    expect(sanitizeResponse(inputs[2])).toBe('Follow these steps');
  });

  it('should strip Markdown code block markers', () => {
    const jsonInput = '```json\n{"status": "ok"}\n```';
    const mdInput = '```markdown\n# Hello\n```';
    
    expect(sanitizeResponse(jsonInput)).toBe('{"status": "ok"}');
    expect(sanitizeResponse(mdInput)).toBe('# Hello');
  });

  it('should trim trailing and leading whitespace', () => {
    const input = '   Text with spaces   \n\n';
    expect(sanitizeResponse(input)).toBe('Text with spaces');
  });

  it('should handle non-string or empty inputs gracefully', () => {
    expect(sanitizeResponse(null)).toBeNull();
    expect(sanitizeResponse(undefined)).toBeUndefined();
    expect(sanitizeResponse(123)).toBe(123);
    expect(sanitizeResponse('')).toBe('');
  });

  it('should preserve valid internal formatting', () => {
    const complex = '1. Step one\n2. Step two\n\n**Note**: Be careful.';
    expect(sanitizeResponse(complex)).toBe(complex);
  });
});
