import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChatService } from '../services/chat.service';
import { Message, ChatState } from '../models/chat.models';
import { trigger, transition, style, animate, state } from '@angular/animations';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css'],
  animations: [
    trigger('chatWindowAnimation', [
      state('open', style({
        transform: 'translateY(0)',
        opacity: 1,
      })),
      state('closed', style({
        transform: 'translateY(20px)',
        opacity: 0,
        pointerEvents: 'none',
      })),
      transition('open <=> closed', [
        animate('300ms ease-in-out')
      ]),
    ]),
    trigger('bubbleAnimation', [
      transition(':enter', [
        style({ transform: 'scale(0)' }),
        animate('200ms ease-out', style({ transform: 'scale(1)' }))
      ]),
    ]),
  ],
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;

  messages: Message[] = [];
  userMessage: string = '';
  isLoading = false;
  error: string | null = null;
  isOpen = false;
  isMobile = false;
  selectedFile: File | null = null;
  filePreview: string | null = null;
  parcelleId: string = '';

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.checkIfMobile();
    window.addEventListener('resize', () => this.checkIfMobile());

    // Load conversation history on component initialization
    console.log('[ChatbotComponent] ngOnInit: Loading conversation history');
    this.chatService.getConversationHistory(50, 0).subscribe({
      next: (response) => {
        console.log('[ChatbotComponent] History loaded successfully');
        if (response.data && response.data.length > 0) {
          console.log('[ChatbotComponent] Opening chat - history found with', response.data.length, 'messages');
          // Open chat if history exists
          this.chatService.openChat();
        }
      },
      error: (err) => {
        console.warn('[ChatbotComponent] Failed to load history', err);
      },
    });

    // Subscribe to chat state after history is being loaded
    this.chatService.chatState$.subscribe((state: ChatState) => {
      console.log('[ChatbotComponent] State updated:', {
        messagesCount: state.messages.length,
        isOpen: state.isOpen,
        isLoading: state.isLoading,
      });
      
      this.messages = state.messages;
      this.isLoading = state.isLoading;
      this.error = state.error;
      this.isOpen = state.isOpen;

      // Auto-scroll to bottom
      setTimeout(() => this.scrollToBottom(), 0);
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  /**
   * Check if device is mobile
   */
  private checkIfMobile(): void {
    this.isMobile = window.innerWidth < 768;
  }

  /**
   * Toggle chat window
   */
  toggleChat(): void {
    this.chatService.toggleChat();
  }

  /**
   * Send user message
   */
  sendMessage(): void {
    if (!this.userMessage.trim()) {
      return;
    }

    const message = this.userMessage.trim();
    this.userMessage = '';

    // Ensure chat is open when sending message
    if (!this.isOpen) {
      this.isOpen = true;
      this.chatService.toggleChat();
    }

    this.chatService.sendMessage(message, this.parcelleId).subscribe({
      error: (err) => {
        console.error('Error sending message:', err);
      },
    });
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      this.error = 'Only JPEG and PNG images are allowed';
      setTimeout(() => (this.error = null), 3000);
      return;
    }

    // Validate file size (25MB)
    if (file.size > 25 * 1024 * 1024) {
      this.error = 'Image file is too large (max 25MB)';
      setTimeout(() => (this.error = null), 3000);
      return;
    }

    this.selectedFile = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.filePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Upload selected image
   */
  uploadImage(): void {
    if (!this.selectedFile) {
      return;
    }

    this.chatService.uploadImage(this.selectedFile, this.parcelleId).subscribe({
      next: () => {
        this.selectedFile = null;
        this.filePreview = null;
        if (this.imageInput) {
          this.imageInput.nativeElement.value = '';
        }
      },
      error: (err) => {
        console.error('Error uploading image:', err);
      },
    });
  }

  /**
   * Cancel file selection
   */
  cancelFileSelection(): void {
    this.selectedFile = null;
    this.filePreview = null;
    if (this.imageInput) {
      this.imageInput.nativeElement.value = '';
    }
  }

  /**
   * Clear chat history
   */
  clearHistory(): void {
    if (confirm('Are you sure you want to clear chat history?')) {
      this.chatService.clearHistory().subscribe({
        error: (err) => {
          console.error('Error clearing history:', err);
        },
      });
    }
  }

  /**
   * Format message for display
   */
  formatMessage(content: string): string {
    return content.replace(/\n/g, '<br>');
  }

  /**
   * Scroll to bottom of messages
   */
  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  /**
   * Handle Enter key in input
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Get tool badge color
   */
  getToolColor(tool: string): string {
    const colors: { [key: string]: string } = {
      getStress: '#ff6b6b',
      getIrrigationStatus: '#4ecdc4',
      getCropCalendar: '#45b7d1',
      detectDisease: '#f7b731',
    };
    return colors[tool] || '#95a5a6';
  }
}
