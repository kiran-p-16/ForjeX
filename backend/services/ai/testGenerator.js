const { generateContent } = require("./geminiClient");

/**
 * Generate production-ready unit test suite (Jest/Vitest) for code
 * @param {string} code 
 * @param {string} filePath 
 * @param {string} [framework] 'jest' | 'vitest'
 * @returns {Promise<object>}
 */
async function generateTestSuite(code, filePath = "module.js", framework = "jest") {
  const prompt = `
You are a Lead QA & Test Automation Engineer for forjeX.
Generate a complete, runnable ${framework.toUpperCase()} test suite for the file "${filePath}".

Code to test:
\`\`\`
${code}
\`\`\`

Requirements:
1. Include imports for ${framework} (describe, it, expect, jest/vi.fn)
2. Mock external dependencies (DB models, HTTP clients, disk I/O)
3. Test happy paths, edge cases, null inputs, and error handlers
4. Aim for >90% code coverage

Return a valid JSON matching this schema:
{
  "testFileName": "${filePath.replace(/\.(js|ts|jsx|tsx)$/, ".test.$1")}",
  "framework": "${framework}",
  "estimatedCoverage": "95%",
  "testCode": "// Complete ready-to-run test file content..."
}
`;

  const rawJson = await generateContent(prompt, { json: true, temperature: 0.2 });

  try {
    return JSON.parse(rawJson);
  } catch (err) {
    return {
      testFileName: `${filePath}.test.js`,
      framework,
      estimatedCoverage: "85%",
      testCode: rawJson,
    };
  }
}

module.exports = { generateTestSuite };
