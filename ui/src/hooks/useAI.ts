import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { aiApi, ChatRequest, TranslateRequest, FeedbackRequest, PronunciationRequest, SpeechRequest } from '../api/ai.api';
import {
  setTranslation,
  setFeedback,
  setPronunciation,
  setSpeech,
  setAiLoading,
  setAiError,
  clearAiState,
} from '../store/aiSlice';
import { addMessage } from '../store/conversationSlice';
import { Message, GrammarCorrection, VocabularyItem } from '../types/chat';

export const useAI = () => {
  const dispatch = useAppDispatch();
  const aiState = useAppSelector((state) => state.ai);

  // 1. Asynchronous Chat Operation
  const chat = useCallback(
    async (payload: ChatRequest) => {
      dispatch(setAiLoading({ key: 'chat', value: true }));
      dispatch(setAiError(null));
      try {
        const result = await aiApi.chat(payload);
        return result;
      } catch (err: any) {
        dispatch(setAiError(err.message || 'Chat request failed'));
        throw err;
      } finally {
        dispatch(setAiLoading({ key: 'chat', value: false }));
      }
    },
    [dispatch]
  );

  // 2. Asynchronous Translation Operation
  const translate = useCallback(
    async (payload: TranslateRequest) => {
      dispatch(setAiLoading({ key: 'translate', value: true }));
      dispatch(setAiError(null));
      try {
        const result = await aiApi.translate(payload);
        dispatch(setTranslation(result));
        return result;
      } catch (err: any) {
        dispatch(setAiError(err.message || 'Translation failed'));
        throw err;
      } finally {
        dispatch(setAiLoading({ key: 'translate', value: false }));
      }
    },
    [dispatch]
  );

  // 3. Asynchronous Conversational Feedback (Evaluates grammar mistakes in user prompt)
  const getFeedback = useCallback(
    async (payload: FeedbackRequest) => {
      dispatch(setAiLoading({ key: 'feedback', value: true }));
      dispatch(setAiError(null));
      try {
        const result = await aiApi.feedback(payload);
        dispatch(setFeedback(result));
        return result;
      } catch (err: any) {
        dispatch(setAiError(err.message || 'Feedback request failed'));
        throw err;
      } finally {
        dispatch(setAiLoading({ key: 'feedback', value: false }));
      }
    },
    [dispatch]
  );

  // 4. Asynchronous Pronunciation Assessment
  const evaluatePronunciation = useCallback(
    async (payload: PronunciationRequest) => {
      dispatch(setAiLoading({ key: 'pronunciation', value: true }));
      dispatch(setAiError(null));
      try {
        const result = await aiApi.pronunciation(payload);
        dispatch(setPronunciation(result));
        return result;
      } catch (err: any) {
        dispatch(setAiError(err.message || 'Pronunciation evaluation failed'));
        throw err;
      } finally {
        dispatch(setAiLoading({ key: 'pronunciation', value: false }));
      }
    },
    [dispatch]
  );

  // 5. Asynchronous Audio Transcription (STT)
  const transcribeSpeech = useCallback(
    async (file: Blob, language: string) => {
      dispatch(setAiLoading({ key: 'speech', value: true }));
      dispatch(setAiError(null));
      try {
        const result = await aiApi.speech(file, language);
        dispatch(setSpeech(result));
        return result;
      } catch (err: any) {
        dispatch(setAiError(err.message || 'Speech transcription failed'));
        throw err;
      } finally {
        dispatch(setAiLoading({ key: 'speech', value: false }));
      }
    },
    [dispatch]
  );

  return {
    ...aiState,
    chat,
    translate,
    getFeedback,
    evaluatePronunciation,
    transcribeSpeech,
    clearAiState: () => dispatch(clearAiState()),
  };
};
