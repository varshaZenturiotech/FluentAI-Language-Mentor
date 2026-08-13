import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { conversationApi, CreateSessionPayload, CreateMessagePayload } from '../api/conversation.api';
import {
  setSessionId,
  setMessages,
  addMessage,
  setIsAiResponding,
  setActiveTopic,
  clearMessages,
} from '../store/conversationSlice';
import { Message, ConversationSession } from '../types/chat';

export const useConversation = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  // Load conversation state from Redux
  const { currentSessionId, messages, activeTopic, isAiResponding, activeVocabulary, recentCorrections } =
    useAppSelector((state) => state.conversation);
  const { isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);

  // TanStack query to fetch all sessions
  const {
    data: sessions,
    isLoading: isLoadingSessions,
    error: sessionsError,
  } = useQuery<ConversationSession[]>({
    queryKey: ['conversations'],
    queryFn: conversationApi.getSessions,
    enabled: isInitialized && isAuthenticated,
    retry: 1,
  });

  // TanStack query to fetch message history for the active session
  const {
    data: sessionMessages,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useQuery<Message[]>({
    queryKey: ['messages', currentSessionId],
    queryFn: () => conversationApi.getMessages(currentSessionId!),
    enabled: !!currentSessionId,
    retry: 1,
  });

  // Sync fetched message list into Redux
  useEffect(() => {
    if (currentSessionId && sessionMessages !== undefined) {
      dispatch(setMessages(sessionMessages));
    }
  }, [sessionMessages, currentSessionId, dispatch]);

  // Mutation to create a new conversation session
  const createSessionMutation = useMutation<ConversationSession, any, CreateSessionPayload>({
    mutationFn: conversationApi.createSession,
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      dispatch(clearMessages());
      dispatch(setSessionId(newSession.id));
      if (newSession.topic) {
        dispatch(setActiveTopic(newSession.topic));
      }
    },
  });

  // Mutation to save a single message payload in the session
  const saveMessageMutation = useMutation<Message, any, { sessionId: string; payload: CreateMessagePayload }>({
    mutationFn: ({ sessionId, payload }) => conversationApi.createMessage(sessionId, payload),
    onSuccess: (savedMessage) => {
      queryClient.invalidateQueries({ queryKey: ['messages', currentSessionId] });
      dispatch(addMessage(savedMessage));
    },
  });

  // Mutation to delete a session
  const deleteSessionMutation = useMutation<void, any, string>({
    mutationFn: conversationApi.deleteSession,
    onSuccess: (_, deletedSessionId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (currentSessionId === deletedSessionId) {
        dispatch(clearMessages());
      }
    },
  });

  const selectSession = (sessionId: string | null) => {
    if (sessionId === null) {
      dispatch(clearMessages());
    } else {
      dispatch(setSessionId(sessionId));
      const activeSession = sessions?.find((s) => s.id === sessionId);
      if (activeSession?.topic) {
        dispatch(setActiveTopic(activeSession.topic));
      }
    }
  };

  return {
    sessions: sessions || [],
    messages,
    currentSessionId,
    activeTopic,
    isAiResponding,
    activeVocabulary,
    recentCorrections,
    isLoading:
      isLoadingSessions ||
      isLoadingMessages ||
      createSessionMutation.isPending ||
      deleteSessionMutation.isPending,
    error: sessionsError || messagesError,
    createSession: createSessionMutation.mutateAsync,
    deleteSession: deleteSessionMutation.mutateAsync,
    saveMessage: saveMessageMutation.mutateAsync,
    selectSession,
    setIsAiResponding: (value: boolean) => dispatch(setIsAiResponding(value)),
    clearConversation: () => dispatch(clearMessages()),
  };
};
