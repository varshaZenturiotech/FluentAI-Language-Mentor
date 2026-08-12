import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ConversationState, Message, GrammarCorrection, VocabularyItem } from '../types/chat';

const initialState: ConversationState = {
  currentSessionId: null,
  messages: [],
  activeTopic: 'Daily Routine & Work',
  isAiResponding: false,
  activeVocabulary: [],
  recentCorrections: [],
};

export const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    setSessionId: (state, action: PayloadAction<string | null>) => {
      state.currentSessionId = action.payload;
    },
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
      if (action.payload.grammarCorrections && action.payload.grammarCorrections.length > 0) {
        // De-duplicate incoming corrections
        action.payload.grammarCorrections.forEach((corr) => {
          const exists = state.recentCorrections.some(
            (c) => c.originalText === corr.originalText && c.correctedText === corr.correctedText
          );
          if (!exists) {
            state.recentCorrections.unshift(corr);
          }
        });
      }
      if (action.payload.newVocabulary && action.payload.newVocabulary.length > 0) {
        // De-duplicate incoming vocab items
        action.payload.newVocabulary.forEach((vocab) => {
          const exists = state.activeVocabulary.some((v) => v.word === vocab.word);
          if (!exists) {
            state.activeVocabulary.unshift(vocab);
          }
        });
      }
    },
    setIsAiResponding: (state, action: PayloadAction<boolean>) => {
      state.isAiResponding = action.payload;
    },
    setActiveTopic: (state, action: PayloadAction<string>) => {
      state.activeTopic = action.payload;
    },
    setVocabulary: (state, action: PayloadAction<VocabularyItem[]>) => {
      state.activeVocabulary = action.payload;
    },
    setCorrections: (state, action: PayloadAction<GrammarCorrection[]>) => {
      state.recentCorrections = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
      state.recentCorrections = [];
      state.activeVocabulary = [];
      state.currentSessionId = null;
    },
    addGrammarCorrection: (state, action: PayloadAction<GrammarCorrection>) => {
      const exists = state.recentCorrections.some(
        (c) => c.originalText === action.payload.originalText && c.correctedText === action.payload.correctedText
      );
      if (!exists) {
        state.recentCorrections.unshift(action.payload);
      }
    },
    addVocabularyItem: (state, action: PayloadAction<VocabularyItem>) => {
      const exists = state.activeVocabulary.some((v) => v.word === action.payload.word);
      if (!exists) {
        state.activeVocabulary.unshift(action.payload);
      }
    },
  },
});

export const {
  setSessionId,
  setMessages,
  addMessage,
  setIsAiResponding,
  setActiveTopic,
  setVocabulary,
  setCorrections,
  clearMessages,
  addGrammarCorrection,
  addVocabularyItem,
} = conversationSlice.actions;

export default conversationSlice.reducer;
