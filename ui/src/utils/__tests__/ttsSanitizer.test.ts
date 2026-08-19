import { sanitizeForTTS } from '../ttsSanitizer';

function assertEqual(actual: string, expected: string, testName: string) {
  if (actual === expected) {
    console.log(`✅ [PASS] ${testName}`);
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    console.error(`   Actual  : "${actual}"`);
    console.error(`   Expected: "${expected}"`);
    throw new Error(`Test failed: ${testName}`);
  }
}

export function runSanitizerTests() {
  console.log('\n--- Running ttsSanitizer Regression Tests ---');

  // 1. Bold
  assertEqual(
    sanitizeForTTS('**cycle tracking**'),
    'cycle tracking',
    '1. Bold (**text**)'
  );

  assertEqual(
    sanitizeForTTS('__cycle tracking__'),
    'cycle tracking',
    '1b. Bold (__text__)'
  );

  // 2. Italic
  assertEqual(
    sanitizeForTTS('*important*'),
    'important',
    '2. Italic (*text*)'
  );

  assertEqual(
    sanitizeForTTS('_important_'),
    'important',
    '2b. Italic (_text_)'
  );

  // 3. Bold italic
  assertEqual(
    sanitizeForTTS('***very useful***'),
    'very useful',
    '3. Bold italic (***text***)'
  );

  assertEqual(
    sanitizeForTTS('___very useful___'),
    'very useful',
    '3b. Bold italic (___text___)'
  );

  // 4. Nested formatting
  assertEqual(
    sanitizeForTTS('**This is *very* useful**'),
    'This is very useful',
    '4. Nested formatting (**This is *very* useful**)'
  );

  // 5. Inline code
  assertEqual(
    sanitizeForTTS('`npm install`'),
    'npm install',
    '5. Inline code (`code`)'
  );

  // 6. Code blocks
  assertEqual(
    sanitizeForTTS('```js\nconst app = "FluentAI";\n```'),
    'const app = "FluentAI";',
    '6. Code block (```code```)'
  );

  // 7. Markdown links
  assertEqual(
    sanitizeForTTS('[FluentAI](https://example.com)'),
    'FluentAI',
    '7. Markdown link ([text](url))'
  );

  // 8. Headings
  assertEqual(
    sanitizeForTTS('### Today\'s Goal'),
    'Today\'s Goal',
    '8. Heading (### Heading)'
  );

  // 9. Unordered lists
  assertEqual(
    sanitizeForTTS('- Practice speaking'),
    'Practice speaking',
    '9. Unordered list (- Item)'
  );

  assertEqual(
    sanitizeForTTS('* Practice speaking'),
    'Practice speaking',
    '9b. Unordered list (* Item)'
  );

  // 10. Ordered lists
  assertEqual(
    sanitizeForTTS('1. Introduce yourself'),
    'Introduce yourself',
    '10. Ordered list (1. Item)'
  );

  // 11. Blockquotes
  assertEqual(
    sanitizeForTTS('> This is a quote'),
    'This is a quote',
    '11. Blockquote (> Quote)'
  );

  // 12. Normal punctuation preservation
  assertEqual(
    sanitizeForTTS('What do you think? I\'m working as a developer. That\'s great!'),
    'What do you think? I\'m working as a developer. That\'s great!',
    '12. Normal English punctuation preservation'
  );

  // 13. Realistic FluentAI response
  const rawResponse = `That sounds like a very useful project! I really like the idea.

A slightly better way to say that is:
"I built a **cycle tracking** app for women."

What was the most challenging part?`;

  const expectedResponse = `That sounds like a very useful project! I really like the idea.

A slightly better way to say that is:
"I built a cycle tracking app for women."

What was the most challenging part?`;

  assertEqual(
    sanitizeForTTS(rawResponse),
    expectedResponse,
    '13. Realistic FluentAI response with Markdown'
  );

  console.log('--- All ttsSanitizer Tests Passed Successfully! ---\n');
}

// Auto-run if executed directly
const proc = (globalThis as any).process;
if (typeof proc !== 'undefined' && proc.argv && proc.argv[1]?.includes('ttsSanitizer.test')) {
  runSanitizerTests();
}
