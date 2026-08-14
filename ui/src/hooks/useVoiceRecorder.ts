import { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { AudioRecorder } from '../audio/recorder';
import { VoiceRecorderState } from '../types/audio.types';
import { useAI } from './useAI';
import { addMessage, setIsAiResponding } from '../store/conversationSlice';
import { MicState, VoiceConnectionStatus } from '../types/voice';

export function useVoiceRecorder() {
  const dispatch = useAppDispatch();
  const { transcribeSpeech, chat } = useAI();
  const currentSessionId = useAppSelector((state) => state.conversation.currentSessionId);

  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    mimeType: null,
    fileSize: null,
    error: null,
  });

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const timerRef = useRef<any>(null);

  // Initialize AudioRecorder instance
  if (!recorderRef.current) {
    recorderRef.current = new AudioRecorder();
  }

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl);
      }
    };
  }, [state.audioUrl]);

  // Derived micState and connectionStatus
  let micState: MicState = 'idle';
  let connectionStatus: VoiceConnectionStatus = 'Connected';

  if (state.isRecording) {
    micState = 'listening';
    connectionStatus = 'Listening...';
  } else if (isTranscribing || isThinking) {
    micState = 'thinking';
    connectionStatus = 'Processing...';
  } else if (state.error || processingError) {
    micState = 'error';
    connectionStatus = 'Disconnected';
  }

  const startListening = async () => {
    if (state.isRecording || isTranscribing || isThinking) return;

    setProcessingError(null);
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }

    setState({
      isRecording: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      mimeType: null,
      fileSize: null,
      error: null,
    });

    try {
      await recorderRef.current?.start();
      setState((prev) => ({
        ...prev,
        isRecording: true,
        error: null,
      }));

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);
      console.log('Recording started');
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isRecording: false,
        error: err.message || 'Failed to start voice recording.',
      }));
    }
  };

  const stopListeningAndSend = async (manualText?: string) => {
    // 1. Text input flow (if text is supplied directly)
    if (manualText && manualText.trim() !== '') {
      const userMessage = {
        id: crypto.randomUUID(),
        sender: 'user' as const,
        text: manualText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      dispatch(addMessage(userMessage));

      dispatch(setIsAiResponding(true));
      setIsThinking(true);
      setProcessingError(null);
      console.log('Chat request started');
      const startTime = Date.now();

      try {
        const chatResult = await chat({
          sessionId: currentSessionId || '00000000-0000-0000-0000-000000000000',
          message: manualText,
          language: 'en',
        });
        console.log(`Chat response received | processing time: ${Date.now() - startTime}ms`);

        const aiMessage = {
          id: crypto.randomUUID(),
          sender: 'ai' as const,
          text: chatResult.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        dispatch(addMessage(aiMessage));
        return chatResult;
      } catch (err: any) {
        setProcessingError(err.message || 'Chat request failed.');
      } finally {
        setIsThinking(false);
        dispatch(setIsAiResponding(false));
      }
      return null;
    }

    // 2. Voice input flow
    if (!state.isRecording) return null;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    console.log('Recording stopped');
    setIsTranscribing(true);
    setProcessingError(null);

    try {
      const result = await recorderRef.current?.stop();
      if (!result) {
        throw new Error('No audio recorded.');
      }

      const { blob, mimeType } = result;
      const audioUrl = URL.createObjectURL(blob);
      setState((prev) => ({
        ...prev,
        isRecording: false,
        audioBlob: blob,
        audioUrl,
        mimeType,
        fileSize: blob.size,
        error: null,
      }));

      // 3. Upload & Transcribe
      console.log('Upload started');
      const transcribeStart = Date.now();
      const speechResponse = await transcribeSpeech(blob, 'en');
      console.log(`Upload finished | Transcript received | processing time: ${Date.now() - transcribeStart}ms`);

      if (!speechResponse || !speechResponse.transcript) {
        throw new Error('Speech recognition failed: No transcript returned.');
      }

      const transcript = speechResponse.transcript;

      // Add user transcript bubble
      const userMessage = {
        id: crypto.randomUUID(),
        sender: 'user' as const,
        text: transcript,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      dispatch(addMessage(userMessage));

      // 4. Send message to chat
      setIsTranscribing(false);
      setIsThinking(true);
      dispatch(setIsAiResponding(true));

      console.log('Chat request started');
      const chatStart = Date.now();
      const chatResult = await chat({
        sessionId: currentSessionId || '00000000-0000-0000-0000-000000000000',
        message: transcript,
        language: 'en',
      });
      console.log(`Chat response received | processing time: ${Date.now() - chatStart}ms`);

      const aiMessage = {
        id: crypto.randomUUID(),
        sender: 'ai' as const,
        text: chatResult.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      dispatch(addMessage(aiMessage));
      return chatResult;
    } catch (err: any) {
      setProcessingError(err.message || 'Failed to process voice input.');
      return null;
    } finally {
      setIsTranscribing(false);
      setIsThinking(false);
      dispatch(setIsAiResponding(false));
    }
  };

  const cancelListening = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    recorderRef.current?.cancel();
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    setState({
      isRecording: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      mimeType: null,
      fileSize: null,
      error: null,
    });
    setProcessingError(null);
    console.log('Recording cancelled');
  };

  const resetRecording = () => {
    cancelListening();
  };

  return {
    ...state,
    isTranscribing,
    isThinking,
    processingError,
    micState,
    connectionStatus,
    startListening,
    stopListeningAndSend,
    cancelListening,
    resetRecording,
    
    // Compatibility Aliases for VoiceRecorder.tsx widget
    startRecording: startListening,
    stopRecording: stopListeningAndSend,
    cancelRecording: cancelListening,
  };
}
