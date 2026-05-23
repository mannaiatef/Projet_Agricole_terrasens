import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService } from '../../core/services/chatbot.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chatbot-page">
      <h1>🤖 AgriSmart AI Assistant</h1>
      <div class="chat-container">
        <div class="chat-messages">
          <div class="message bot">
            <p>Hello! I'm AgriSmart AI. How can I help you with your crops today?</p>
          </div>
        </div>
        <div class="chat-input">
          <input 
            type="text" 
            [(ngModel)]="userMessage" 
            placeholder="Ask me anything about your crops..."
            (keyup.enter)="sendMessage()"
          />
          <button (click)="sendMessage()">Send</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chatbot-page { padding: 30px; }
    h1 { color: #1a2a1a; }
    .chat-container { background: white; border-radius: 12px; padding: 20px; max-width: 600px; }
    .chat-messages { height: 400px; overflow-y: auto; margin-bottom: 20px; display: flex; flex-direction: column; gap: 10px; }
    .message { padding: 12px 16px; border-radius: 8px; max-width: 80%; }
    .message.bot { background: #f0f7f0; color: #1a2a1a; align-self: flex-start; }
    .message.user { background: #4caf50; color: white; align-self: flex-end; }
    .message p { margin: 0; }
    .chat-input { display: flex; gap: 10px; }
    input { flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 10px; }
    button { background: #4caf50; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
  `]
})
export class ChatbotComponent {
  userMessage = '';

  constructor(private chatbotService: ChatbotService) { }

  sendMessage() {
    if (!this.userMessage.trim()) return;
    
    this.chatbotService.sendMessage(this.userMessage).subscribe({
      next: (response) => {
        this.userMessage = '';
      },
      error: (err) => {
        console.error('Chat error', err);
      }
    });
  }
}
