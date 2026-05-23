import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import {
  Message,
  ChatResponse,
  ImageAnalysisResponse,
  ConversationHistory,
  ConversationHistoryResponse,
  ChatState,
} from '../models/chat.models';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private chatStateSubject = new BehaviorSubject<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    isOpen: false,
  });

  public chatState$ = this.chatStateSubject.asObservable();
  private apiUrl = '/api/chat';

  constructor(private http: HttpClient) {
    // History will be loaded by the component
    console.log('[ChatService] Service initialized');
  }

  /**
   * Send a text message to the chatbot
   */
  sendMessage(message: string, parcelleId?: string): Observable<ChatResponse> {
    const payload = {
      message,
      ...(parcelleId && { parcelleId }),
    };

    this.updateChatState({ isLoading: true, error: null });

    return this.http.post<ChatResponse>(this.apiUrl, payload).pipe(
      tap((response) => {
        if (response.success && response.data) {
          // Add user message
          this.addMessage({
            type: 'user',
            content: message,
            timestamp: new Date(),
          });

          // Add bot response
          this.addMessage({
            type: 'bot',
            content: response.data.response,
            timestamp: new Date(),
            toolsUsed: response.data.toolsUsed,
          });

          this.updateChatState({ isLoading: false });
        }
      }),
      catchError((error) => {
        const errorMsg = error.error?.message || 'Failed to send message';
        this.updateChatState({ isLoading: false, error: errorMsg });
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  /**
   * Upload an image for disease detection
   */
  uploadImage(file: File, parcelleId?: string): Observable<ImageAnalysisResponse> {
    const formData = new FormData();
    formData.append('image', file);
    if (parcelleId) {
      formData.append('parcelleId', parcelleId);
    }

    this.updateChatState({ isLoading: true, error: null });

    return this.http
      .post<ImageAnalysisResponse>(`${this.apiUrl}/image`, formData)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            // Add image upload notification
            this.addMessage({
              type: 'user',
              content: `🌾 Image: ${file.name}`,
              timestamp: new Date(),
            });

            // Add analysis result
            this.addMessage({
              type: 'bot',
              content: `${response.data.analysis}\n\n📋 Recommendations:\n${response.data.recommendations}`,
              timestamp: new Date(),
              toolsUsed: ['detectDisease'],
            });

            this.updateChatState({ isLoading: false });
          }
        }),
        catchError((error) => {
          const errorMsg = error.error?.message || 'Failed to process image';
          this.updateChatState({ isLoading: false, error: errorMsg });
          return throwError(() => new Error(errorMsg));
        })
      );
  }

  /**
   * Get conversation history
   */
  getConversationHistory(
    limit: number = 50,
    offset: number = 0
  ): Observable<ConversationHistoryResponse> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http
      .get<ConversationHistoryResponse>(`${this.apiUrl}/history`, { params })
      .pipe(
        tap((response) => {
          console.log('[ChatService] getConversationHistory response:', response);
          if (response.success && response.data) {
            // Load history into messages
            console.log('[ChatService] Loading', response.data?.length || 0, 'conversations into state');
            this.clearMessages();
            if (response.data && Array.isArray(response.data)) {
              for (const conversation of response.data) {
                this.addMessage({
                  id: conversation.id,
                  type: 'user',
                  content: conversation.userMessage,
                  timestamp: new Date(conversation.createdAt),
                  toolsUsed: conversation.toolsUsed,
                });

                this.addMessage({
                  type: 'bot',
                  content: conversation.botResponse,
                  timestamp: new Date(conversation.createdAt),
                  toolsUsed: conversation.toolsUsed,
                });
              }
              console.log('[ChatService] Successfully loaded', response.data.length, 'conversations');
            }
          }
        }),
        catchError((error) => {
          console.error('[ChatService] Failed to load conversation history', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Clear all conversation history
   */
  clearHistory(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/history`).pipe(
      tap(() => {
        this.clearMessages();
        this.updateChatState({ messages: [], error: null });
      }),
      catchError((error) => {
        const errorMsg = error.error?.message || 'Failed to clear history';
        this.updateChatState({ error: errorMsg });
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  /**
   * Add a message to the chat
   */
  private addMessage(message: Message): void {
    const currentState = this.chatStateSubject.value;
    this.chatStateSubject.next({
      ...currentState,
      messages: [...currentState.messages, message],
    });
  }

  /**
   * Clear all messages
   */
  private clearMessages(): void {
    const currentState = this.chatStateSubject.value;
    this.chatStateSubject.next({
      ...currentState,
      messages: [],
    });
  }

  /**
   * Update chat state
   */
  private updateChatState(state: Partial<ChatState>): void {
    const currentState = this.chatStateSubject.value;
    this.chatStateSubject.next({
      ...currentState,
      ...state,
    });
  }

  /**
   * Toggle chat window open/close
   */
  toggleChat(): void {
    const currentState = this.chatStateSubject.value;
    this.chatStateSubject.next({
      ...currentState,
      isOpen: !currentState.isOpen,
    });
  }

  /**
   * Open chat window
   */
  openChat(): void {
    const currentState = this.chatStateSubject.value;
    if (!currentState.isOpen) {
      this.chatStateSubject.next({
        ...currentState,
        isOpen: true,
      });
    }
  }

  /**
   * Close chat window
   */
  closeChat(): void {
    const currentState = this.chatStateSubject.value;
    if (currentState.isOpen) {
      this.chatStateSubject.next({
        ...currentState,
        isOpen: false,
      });
    }
  }

  /**
   * Get messages observable
   */
  getMessages(): Observable<Message[]> {
    return new Observable((observer) => {
      this.chatState$.subscribe((state) => {
        observer.next(state.messages);
      });
    });
  }

  /**
   * Get loading state
   */
  isLoading(): Observable<boolean> {
    return new Observable((observer) => {
      this.chatState$.subscribe((state) => {
        observer.next(state.isLoading);
      });
    });
  }

  /**
   * Get error state
   */
  getError(): Observable<string | null> {
    return new Observable((observer) => {
      this.chatState$.subscribe((state) => {
        observer.next(state.error);
      });
    });
  }

  /**
   * Load conversation history on init
   */
  private loadConversationHistory(): void {
    console.log('[ChatService] Loading conversation history on init...');
    this.getConversationHistory(20).subscribe({
      next: (response) => {
        console.log('[ChatService] History loaded successfully:', response.data?.length || 0, 'conversations');
        // Auto-open chat if history exists
        if (response.data && response.data.length > 0) {
          console.log('[ChatService] Opening chat - history found');
          this.updateChatState({ isOpen: true });
        }
      },
      error: (err) => {
        console.warn('[ChatService] Could not load conversation history', err);
      },
    });
  }
}
