import apiClient from './axios';
import { ConversationSession, Message } from '../types/chat';

export interface CreateSessionPayload {
  title: string;
  topic?: string;
  lessonType?: string;
  language?: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

export interface CreateMessagePayload {
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  translatedText?: string;
  correctedText?: string;
  feedback?: string;
}

const mapMessage = (m: any): Message => ({
  id: m.id,
  sender: m.role.toLowerCase() === 'user' ? 'user' : 'ai',
  text: m.content,
  malayalamTranslation: m.translatedText || undefined,
  timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  grammarCorrections: m.correctedText ? [
    {
      originalText: '',
      correctedText: m.correctedText,
      explanation: m.feedback || '',
      ruleCategory: 'Grammar',
    }
  ] : undefined,
});

export const conversationApi = {
  async getSessions(): Promise<ConversationSession[]> {
    const response = await apiClient.get('/conversations');
    return response.data.data;
  },

  async createSession(payload: CreateSessionPayload): Promise<ConversationSession> {
    const response = await apiClient.post('/conversations', payload);
    return response.data.data;
  },

  async getMessages(sessionId: string): Promise<Message[]> {
    const response = await apiClient.get(`/conversations/${sessionId}/messages`);
    return (response.data.data || []).map(mapMessage);
  },

  async createMessage(sessionId: string, payload: CreateMessagePayload): Promise<Message> {
    const response = await apiClient.post(`/conversations/${sessionId}/messages`, payload);
    return mapMessage(response.data.data);
  },

  async deleteSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/conversations/${sessionId}`);
  },
};

