import { Message, GrammarCorrection, VocabularyItem } from '../types/chat';
import { delay } from './apiClient';

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg_1',
    sender: 'ai',
    text: 'Namaskaram Rahul! Welcome back to FluentAI. Today we can practice talking about your daily routine or career goals. How are you feeling today?',
    malayalamTranslation: 'നമസ്കാരം രാഹുൽ! ഫ്ലൂവന്റ്-എഐ-യിലേക്ക് വീണ്ടും സ്വാഗതം. ഇന്ന് നിങ്ങള്‍ക്ക് ദൈനംദിന ജീവിതത്തെക്കുറിച്ചോ കരിയർ ലക്ഷ്യങ്ങളെക്കുറിച്ചോ സംസാരിക്കാം. ഇന്ന് എങ്ങനെയുണ്ട്?',
    timestamp: '10:00 AM',
  },
  {
    id: 'msg_2',
    sender: 'user',
    text: 'I am fine. Today I go to office and had many meetings with my clients.',
    timestamp: '10:01 AM',
    grammarCorrections: [
      {
        originalText: 'I go to office',
        correctedText: 'I went to the office',
        explanation: 'Use past tense ("went") because you are describing an action that already happened earlier today. Also include the article "the".',
        ruleCategory: 'Tense',
        malayalamExplanation: 'ഇന്ന് സംഭവിച്ച കാര്യമായതിനാൽ "went to the office" എന്ന് ഭൂതകാലത്തിൽ ഉപയോഗിക്കുക.',
      },
    ],
  },
  {
    id: 'msg_3',
    sender: 'ai',
    text: 'That sounds busy! Great attempt. Remember to use "went" for actions completed earlier today. What was the most productive meeting you had?',
    malayalamTranslation: 'വളരെ തിരക്കുള്ള ദിവസമായിരുന്നല്ലേ! നല്ല ശ്രമം. "went" എന്ന് പറയുന്നതാണ് കൂടുതൽ ശരി. നിങ്ങളുടെ ഇന്നത്തെ മീറ്റിംഗുകളിൽ ഏറ്റവും പ്രയോജനകരമായത് ഏതായിരുന്നു?',
    timestamp: '10:01 AM',
    newVocabulary: [
      {
        id: 'vocab_productive',
        word: 'Productive',
        phonetic: '/prəˈdʌk.tɪv/',
        meaning: 'Producing or achieving significant results or benefits.',
        malayalamMeaning: 'ഉല്പാദനക്ഷമമായ / പ്രയോജനകരമായ',
        example: 'We had a very productive discussion regarding project timelines.',
        partOfSpeech: 'Adjective',
        masteryPercentage: 75,
      },
    ],
  },
];

export const chatService = {
  async fetchMessages(): Promise<Message[]> {
    await delay(500);
    return INITIAL_MESSAGES;
  },

  async sendMessage(userText: string): Promise<{ aiMessage: Message; grammarCorrections?: GrammarCorrection[] }> {
    await delay(1200);

    let corrections: GrammarCorrection[] | undefined;
    let textLower = userText.toLowerCase();

    if (textLower.includes('i discuss about') || textLower.includes('discuss about')) {
      corrections = [
        {
          originalText: 'discuss about',
          correctedText: 'discuss',
          explanation: 'The verb "discuss" already implies "about". Say "we discussed the topic" rather than "discussed about".',
          ruleCategory: 'Preposition',
          malayalamExplanation: '"Discuss" എന്ന് പറയുമ്പോൾ അതിൽ "about" ഉൾപ്പെടുന്നു.',
        },
      ];
    } else if (textLower.includes('yesterday i go') || textLower.includes('i goes')) {
      corrections = [
        {
          originalText: 'i go',
          correctedText: 'I went',
          explanation: 'Past tense is required for past activities.',
          ruleCategory: 'Tense',
          malayalamExplanation: 'കഴിഞ്ഞ കാര്യങ്ങൾക്ക് Past Tense ഉപയോഗിക്കണം.',
        },
      ];
    }

    const aiResponses = [
      {
        text: `That's very interesting! Talking in English continuously helps you express complex ideas smoothly. Would you like to practice explaining your main project?`,
        malayalamTranslation: `അത് വളരെ രസകരമാണ്! ഇംഗ്ലീഷിൽ തുടർച്ചയായി സംസാരിക്കുന്നത് കൂടുതൽ ആത്മവിശ്വാസം നൽകും. നിങ്ങളുടെ പ്രധാന പ്രോജക്റ്റിനെക്കുറിച്ച് വിശദീകരിക്കാമോ?`,
      },
      {
        text: `Excellent vocabulary! You used clear structure in that sentence. How do you usually prepare before an important presentation?`,
        malayalamTranslation: `വളരെ മികച്ച വാക്യഘടന! സാധാരണ ഒരു അവതരണത്തിന് മുന്നോടിയായി നിങ്ങൾ എങ്ങനെയാണ് തയ്യാറെടുക്കുന്നത്?`,
      },
      {
        text: `Spot on! Regular practice builds fluency. Let's try adding two new professional vocabulary words to our next sentence.`,
        malayalamTranslation: `കൃത്യമാണ്! പതിവ് പരിശീലനം നിങ്ങളുടെ സംസാരിക്കാനുള്ള കഴിവ് വർദ്ധിപ്പിക്കും.`,
      },
    ];

    const randomResp = aiResponses[Math.floor(Math.random() * aiResponses.length)];

    const aiMessage: Message = {
      id: `msg_${Date.now()}`,
      sender: 'ai',
      text: randomResp.text,
      malayalamTranslation: randomResp.malayalamTranslation,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      grammarCorrections: corrections,
    };

    return { aiMessage, grammarCorrections: corrections };
  },

  async clearChat(): Promise<void> {
    await delay(300);
  },
};
