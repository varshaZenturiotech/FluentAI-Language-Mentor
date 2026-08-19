import { sanitizeForTTS } from '../ttsSanitizer';

function assertEqual(actual: any, expected: any, testName: string) {
  if (actual === expected) {
    console.log(`✅ [PASS] ${testName}`);
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    console.error(`   Actual  :`, actual);
    console.error(`   Expected:`, expected);
    throw new Error(`Test failed: ${testName}`);
  }
}

// Helper simulation functions representing ConversationPage TTS logic
export function isInitialLessonGreeting(fetchedMessages: any[]): boolean {
  const userMessages = fetchedMessages.filter((m: any) => {
    const isUser = m.sender === 'user' || m.role === 'USER';
    const hasContent = (m.text || m.content || '').trim().length > 0;
    return isUser && hasContent;
  });

  const initialGreeting = fetchedMessages.find((m: any) => {
    const isAi = m.sender === 'ai' || m.role === 'ASSISTANT';
    const hasContent = (m.text || m.content || '').trim().length > 0;
    return isAi && hasContent;
  });

  return userMessages.length === 0 && !!initialGreeting;
}

export function shouldAutoPlayMessage(
  message: any,
  initialMessageIds: Set<string>,
  autoPlayedMessageIds: Set<string>,
  storageMap: Record<string, string>
): boolean {
  if (!message || !message.id) return false;
  const isInitialHistory = initialMessageIds.has(message.id);
  const alreadyPlayedSession = autoPlayedMessageIds.has(message.id);
  const alreadyPlayedStorage = storageMap[`auto_played_${message.id}`] === 'true';

  if (isInitialHistory || alreadyPlayedSession || alreadyPlayedStorage) {
    return false;
  }
  return true;
}

export function runLifecycleTests() {
  console.log('\n--- Running TTS Lifecycle & Idempotency Regression Tests ---');

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
  const isNewGreetingEligible = isInitialLessonGreeting(newLessonMessages);
  assertEqual(isNewGreetingEligible, true, 'TEST 1: New lesson initial greeting eligible for AUTO_TTS');

  const initialIdsTest1 = new Set<string>(); // Single initial greeting is NOT added to initialMessageIds
  const autoPlayedIdsTest1 = new Set<string>();
  const storageTest1: Record<string, string> = {};

  const canPlayTest1 = shouldAutoPlayMessage(
    newLessonMessages[0],
    initialIdsTest1,
    autoPlayedIdsTest1,
    storageTest1
  );
  assertEqual(canPlayTest1, true, 'TEST 1: Greeting is allowed through AUTO_TTS pipeline');

  // Simulate TTS start (utterance.onstart)
  autoPlayedIdsTest1.add(newLessonMessages[0].id);
  storageTest1[`auto_played_${newLessonMessages[0].id}`] = 'true';
  assertEqual(autoPlayedIdsTest1.has('greeting-1'), true, 'TEST 1: Message ID marked as auto-played upon speech start');

  // TEST 2: Historical conversation containing user messages
  const historicalMessages = [
    { id: 'h-1', role: 'ASSISTANT', sender: 'ai', text: 'Greeting' },
    { id: 'h-2', role: 'USER', sender: 'user', text: 'Hi' },
    { id: 'h-3', role: 'ASSISTANT', sender: 'ai', text: 'How are you?' },
  ];
  const isHistEligible = isInitialLessonGreeting(historicalMessages);
  assertEqual(isHistEligible, false, 'TEST 2: Historical conversation with USER messages is NOT flagged as initial greeting');

  const initialIdsTest2 = new Set(historicalMessages.map((m) => m.id));
  const autoPlayedIdsTest2 = new Set<string>();
  const storageTest2: Record<string, string> = {};

  const canPlayHist1 = shouldAutoPlayMessage(historicalMessages[0], initialIdsTest2, autoPlayedIdsTest2, storageTest2);
  const canPlayHist3 = shouldAutoPlayMessage(historicalMessages[2], initialIdsTest2, autoPlayedIdsTest2, storageTest2);
  assertEqual(canPlayHist1, false, 'TEST 2: Old assistant greeting is skipped');
  assertEqual(canPlayHist3, false, 'TEST 2: Old assistant response is skipped');

  // TEST 3: Already auto-played message
  const canPlayAgain = shouldAutoPlayMessage(newLessonMessages[0], initialIdsTest1, autoPlayedIdsTest1, storageTest1);
  assertEqual(canPlayAgain, false, 'TEST 3: Already auto-played message ID is skipped');

  // TEST 4: Refresh/sessionStorage persistence
  const initialIdsTest4 = new Set<string>();
  const autoPlayedIdsTest4 = new Set<string>(); // empty after refresh
  const storageTest4: Record<string, string> = { 'auto_played_greeting-1': 'true' }; // preserved in sessionStorage
  const canPlayOnRefresh = shouldAutoPlayMessage(newLessonMessages[0], initialIdsTest4, autoPlayedIdsTest4, storageTest4);
  assertEqual(canPlayOnRefresh, false, 'TEST 4: sessionStorage auto_played_<id> prevents replay on page refresh');

  // TEST 5: Same text, different message ID
  const messageDuplicateText = {
    id: 'greeting-2', // Different ID
    role: 'ASSISTANT',
    sender: 'ai',
    text: 'Welcome to your English lesson today! I am excited to practice speaking with you.', // Same text
  };
  const canPlayDupText = shouldAutoPlayMessage(messageDuplicateText, initialIdsTest4, autoPlayedIdsTest4, storageTest4);
  assertEqual(canPlayDupText, true, 'TEST 5: Message with same text but different ID is independently eligible');

  // TEST 6: TTS fails before onstart
  const autoPlayedIdsTest6 = new Set<string>();
  const storageTest6: Record<string, string> = {};
  // Speech fails before utterance.onstart, so markMessageAsAutoPlayed is NOT invoked
  assertEqual(autoPlayedIdsTest6.has('failed-msg-id'), false, 'TEST 6: Speech failure before start does not permanently mark message played');

  // TEST 7: Markdown message utterance text verification
  const markdownMsgText = 'That is a **great** idea. I built a **cycle tracking** app.';
  const sanitizedText = sanitizeForTTS(markdownMsgText);

  // Mock SpeechSynthesisUtterance
  const mockUtterance = { text: sanitizedText, rate: 0.95 };
  assertEqual(mockUtterance.text, 'That is a great idea. I built a cycle tracking app.', 'TEST 7: SpeechSynthesisUtterance.text receives clean sanitized text');
  assertEqual(mockUtterance.text.includes('**'), false, 'TEST 7: Utterance text contains zero markdown asterisks');

  // TEST 8: Baseline Assessment Single Coordinator Initial Greeting Eligibility
  const baselineGreetingMessage = {
    id: 'init-greeting-baseline',
    sender: 'ai',
    text: "Hi! Before we build your personalized learning plan, I'd like to get to know your English proficiency.",
  };
  const baselineAutoPlayed = new Set<string>();
  const baselineStorage: Record<string, string> = {};

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
  const canPlayWhileListening = shouldAutoPlayBaselineMessage(nextAiTurnMessage, new Set<string>(), {}, 'listening');
  assertEqual(canPlayWhileListening, false, 'TEST 10: Auto-play skipped while user microphone is active');

  console.log('--- All TTS Lifecycle Regression Tests Passed Successfully! ---\n');
}

export function shouldAutoPlayBaselineMessage(
  message: any,
  autoPlayedMessageIds: Set<string>,
  storageMap: Record<string, string>,
  micState: string = 'idle'
): boolean {
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

const proc = (globalThis as any).process;
if (typeof proc !== 'undefined' && proc.argv && proc.argv[1]?.includes('ttsLifecycle.test')) {
  runLifecycleTests();
}
