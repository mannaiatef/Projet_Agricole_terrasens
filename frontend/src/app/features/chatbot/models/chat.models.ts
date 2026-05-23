export interface Message {
  id?: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  toolsUsed?: string[];
  metadata?: any;
}

export interface ChatResponse {
  success: boolean;
  data?: {
    conversationId: string;
    response: string;
    toolsUsed: string[];
    timestamp: string;
  };
  message?: string;
  error?: string;
}

export interface ImageAnalysisResponse {
  success: boolean;
  data?: {
    conversationId: string;
    analysis: string;
    recommendations: string;
    diseaseData: any;
    timestamp: string;
  };
  message?: string;
  error?: string;
}

export interface ConversationHistory {
  id: string;
  userMessage: string;
  botResponse: string;
  toolsUsed: string[];
  confidence: number;
  createdAt: string;
}

export interface ConversationHistoryResponse {
  success: boolean;
  data?: ConversationHistory[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
  };
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
}
