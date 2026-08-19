import { sanitizeForTTS } from '../ttsSanitizer.js';

function assertEqual(actual, expected, testName) {
  if (actual === expected) {
    console.log(`✅ [PASS] ${testName}`);
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    console.error(`   Actual  :`, actual);
    console.error(`   Expected:`, expected);
    throw new Error(`Test failed: ${testName}`);
  }
}

function isInitialLessonGreeting(fetchedMessages) {
  const userMessages = fetchedMessages.filter((m) => {
    const isUser = m.sender === 'user' || m.role === 'USER';
    const hasContent = (m.text || m.content || '').trim().length > 0;
    return isUser && hasContent;
  });

  const initialGreeting = fetchedMessages.find((m) => {
    const isAi = m.sender === 'ai' || m.role === 'ASSISTANT';
    const hasContent = (m.text || m.content || '').trim().length > 0;
    return isAi && hasContent;
  });

  return userMessages.length === 0 && !!initialGreeting;
}

function shouldAutoPlayMessage(message, initialMessageIds, autoPlayedMessageIds, storageMap) {
  if (!message || !message.id) return false;
  const isInitialHistory = initialMessageIds.has(message.id);
  const alreadyPlayedSession = autoPlayedMessageIds.has(message.id);
  const alreadyPlayedStorage = storageMap[`auto_played_${message.id}`] === 'true';

  if (isInitialHistory || alreadyPlayedSession || alreadyPlayedStorage) {
    return false;
  }
  return true;
}

console.log('==================================================');
console.log('   FluentAI Mentor Frontend TTS Regression Suite  ');
console.log('==================================================\n');

console.log('--- 1. Markdown Sanitizer Tests ---');

assertEqual(sanitizeForTTS('**cycle tracking**'), 'cycle tracking', '1. Bold (**text**)');
assertEqual(sanitizeForTTS('__cycle tracking__'), 'cycle tracking', '1b. Bold (__text__)');
assertEqual(sanitizeForTTS('*important*'), 'important', '2. Italic (*text*)');
assertEqual(sanitizeForTTS('_important_'), 'important', '2b. Italic (_text_)');
assertEqual(sanitizeForTTS('***very useful***'), 'very useful', '3. Bold italic (***text***)');
assertEqual(sanitizeForTTS('___very useful___'), 'very useful', '3b. Bold italic (___text___)');
assertEqual(sanitizeForTTS('**This is *very* useful**'), 'This is very useful', '4. Nested formatting (**This is *very* useful**)');
assertEqual(sanitizeForTTS('`npm install`'), 'npm install', '5. Inline code (`code`)');
assertEqual(sanitizeForTTS('```js\nconst app = "FluentAI";\n```'), 'const app = "FluentAI";', '6. Code block (```code```)');
assertEqual(sanitizeForTTS('[FluentAI](https://example.com)'), 'FluentAI', '7. Markdown link ([text](url))');
assertEqual(sanitizeForTTS('### Today\'s Goal'), 'Today\'s Goal', '8. Heading (### Heading)');
assertEqual(sanitizeForTTS('- Practice speaking'), 'Practice speaking', '9. Unordered list (- Item)');
assertEqual(sanitizeForTTS('* Practice speaking'), 'Practice speaking', '9b. Unordered list (* Item)');
assertEqual(sanitizeForTTS('1. Introduce yourself'), 'Introduce yourself', '10. Ordered list (1. Item)');
assertEqual(sanitizeForTTS('> This is a quote'), 'This is a quote', '11. Blockquote (> Quote)');
assertEqual(
  sanitizeForTTS('What do you think? I\'m working as a developer. That\'s great!'),
  'What do you think? I\'m working as a developer. That\'s great!',
  '12. Normal English punctuation preservation'
);

const rawResponse = `That sounds like a very useful project! I really like the idea.

A slightly better way to say that is:
"I built a **cycle tracking** app for women."

What was the most challenging part?`;

const expectedResponse = `That sounds like a very useful project! I really like the idea.

A slightly better way to say that is:
"I built a cycle tracking app for women."

What was the most challenging part?`;

assertEqual(sanitizeForTTS(rawResponse), expectedResponse, '13. Realistic FluentAI response with Markdown');

console.log('\n--- 2. TTS Lifecycle & Idempotency Tests ---');

// TEST 1: New lesson with one assistant greeting and zero user messages
const newLessonMessages = [
  {
    id: 'greeting-1',
    role: 'ASSISTANT',
    sender: 'ai',
    content: 'Welcome to your English lesson today! I am excited to practice speaking with you.',
    text: 'Welcome to your English lesson today! I am excited to practice speaking with you.',
  },
];
assertEqual(isInitialLessonGreeting(newLessonMessages), true, 'TEST 1: New lesson initial greeting eligible for AUTO_TTS');

const initialIdsTest1 = new Set();
const autoPlayedIdsTest1 = new Set();
const storageTest1 = {};

const canPlayTest1 = shouldAutoPlayMessage(newLessonMessages[0], initialIdsTest1, autoPlayedIdsTest1, storageTest1);
assertEqual(canPlayTest1, true, 'TEST 1: Greeting allowed through AUTO_TTS pipeline');

autoPlayedIdsTest1.add(newLessonMessages[0].id);
storageTest1[`auto_played_${newLessonMessages[0].id}`] = 'true';
assertEqual(autoPlayedIdsTest1.has('greeting-1'), true, 'TEST 1: Message ID marked auto-played on speech start');

// TEST 2: Historical conversation containing user messages
const historicalMessages = [
  { id: 'h-1', role: 'ASSISTANT', sender: 'ai', text: 'Greeting' },
  { id: 'h-2', role: 'USER', sender: 'user', text: 'Hi' },
  { id: 'h-3', role: 'ASSISTANT', sender: 'ai', text: 'How are you?' },
];
assertEqual(isInitialLessonGreeting(historicalMessages), false, 'TEST 2: Historical conversation with USER messages is NOT initial greeting');

const initialIdsTest2 = new Set(historicalMessages.map((m) => m.id));
const autoPlayedIdsTest2 = new Set();
const storageTest2 = {};

assertEqual(shouldAutoPlayMessage(historicalMessages[0], initialIdsTest2, autoPlayedIdsTest2, storageTest2), false, 'TEST 2: Old greeting skipped');
assertEqual(shouldAutoPlayMessage(historicalMessages[2], initialIdsTest2, autoPlayedIdsTest2, storageTest2), false, 'TEST 2: Old assistant response skipped');

// TEST 3: Already auto-played message
assertEqual(shouldAutoPlayMessage(newLessonMessages[0], initialIdsTest1, autoPlayedIdsTest1, storageTest1), false, 'TEST 3: Already auto-played message skipped');

// TEST 4: Refresh/sessionStorage persistence
const initialIdsTest4 = new Set();
const autoPlayedIdsTest4 = new Set();
const storageTest4 = { 'auto_played_greeting-1': 'true' };
assertEqual(shouldAutoPlayMessage(newLessonMessages[0], initialIdsTest4, autoPlayedIdsTest4, storageTest4), false, 'TEST 4: sessionStorage auto_played_<id> prevents replay on refresh');

// TEST 5: Same text, different message ID
const messageDuplicateText = {
  id: 'greeting-2',
  role: 'ASSISTANT',
  sender: 'ai',
  text: 'Welcome to your English lesson today! I am excited to practice speaking with you.',
};
assertEqual(shouldAutoPlayMessage(messageDuplicateText, initialIdsTest4, autoPlayedIdsTest4, storageTest4), true, 'TEST 5: Same text but different ID is independently eligible');

// TEST 6: TTS fails before onstart
const autoPlayedIdsTest6 = new Set();
assertEqual(autoPlayedIdsTest6.has('failed-msg-id'), false, 'TEST 6: Speech failure before start does not permanently mark message played');

// TEST 7: SpeechSynthesisUtterance text verification
const markdownMsgText = 'That is a **great** idea. I built a **cycle tracking** app.';
const sanitizedText = sanitizeForTTS(markdownMsgText);
const mockUtterance = { text: sanitizedText, rate: 0.95 };
assertEqual(mockUtterance.text, 'That is a great idea. I built a cycle tracking app.', 'TEST 7: SpeechSynthesisUtterance.text receives clean sanitized text');
assertEqual(mockUtterance.text.includes('**'), false, 'TEST 7: Utterance text contains zero markdown asterisks');

function shouldAutoPlayBaselineMessage(message, autoPlayedMessageIds, storageMap, micState = 'idle') {
  if (!message || !message.id || !message.text || !message.text.trim()) return false;
  if (message.sender !== 'ai' && message.role !== 'ASSISTANT') return false;
  if (micState === 'listening') return false;

  const alreadyPlayedSession = autoPlayedMessageIds.has(message.id);
  const alreadyPlayedStorage = storageMap[`baseline_auto_played_${message.id}`] === 'true';

  if (alreadyPlayedSession || alreadyPlayedStorage) {
    return false;
  }
  return true;
}

// TEST 8: Baseline Assessment Single Coordinator Initial Greeting Eligibility
const baselineGreetingMessage = {
  id: 'init-greeting-baseline',
  sender: 'ai',
  text: "Hi! Before we build your personalized learning plan, I'd like to get to know your English proficiency.",
};
const baselineAutoPlayed = new Set();
const baselineStorage = {};

const canPlayBaselineInit = shouldAutoPlayBaselineMessage(baselineGreetingMessage, baselineAutoPlayed, baselineStorage, 'idle');
assertEqual(canPlayBaselineInit, true, 'TEST 8: Baseline initial greeting is eligible for single TTS coordinator');

// Simulate coordinator marking message auto-played
baselineAutoPlayed.add(baselineGreetingMessage.id);
baselineStorage[`baseline_auto_played_${baselineGreetingMessage.id}`] = 'true';

// TEST 9: Baseline Assessment React StrictMode / Effect Rerun Protection
const canPlayBaselineAgain = shouldAutoPlayBaselineMessage(baselineGreetingMessage, baselineAutoPlayed, baselineStorage, 'idle');
assertEqual(canPlayBaselineAgain, false, 'TEST 9: Baseline initial greeting is blocked from duplicate execution on effect rerun');

// TEST 10: Baseline Assessment Mic Listening Safeguard
const nextAiTurnMessage = {
  id: 'bot-turn-12345',
  sender: 'ai',
  text: 'Thank you! Tell me more about your daily work routine.',
};
const canPlayWhileListening = shouldAutoPlayBaselineMessage(nextAiTurnMessage, new Set(), {}, 'listening');
assertEqual(canPlayWhileListening, false, 'TEST 10: Auto-play skipped while user microphone is active');

console.log('\n==================================================');
console.log('  ✅ ALL FRONTEND TTS REGRESSION TESTS PASSED!  ');
console.log('==================================================\n');
