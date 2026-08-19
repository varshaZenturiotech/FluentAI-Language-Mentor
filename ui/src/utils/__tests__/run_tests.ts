import { runSanitizerTests } from './ttsSanitizer.test';
import { runLifecycleTests } from './ttsLifecycle.test';

console.log('==================================================');
console.log('   FluentAI Mentor Frontend TTS Regression Suite  ');
console.log('==================================================');

try {
  runSanitizerTests();
  runLifecycleTests();
  console.log('✅ ALL FRONTEND TTS REGRESSION TESTS PASSED!');
} catch (err: any) {
  console.error('❌ FRONTEND TTS REGRESSION TESTS FAILED:', err.message);
  (globalThis as any).process?.exit?.(1);
}
