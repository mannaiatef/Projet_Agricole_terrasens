# Frontend Integration Guide - Chatbot Component

## Overview

This guide explains how to integrate the TerraSens chatbot component into your Angular application.

## Quick Start

### 1. Import the Chatbot Component

In your main app component:

```typescript
import { ChatbotComponent } from './features/chatbot/components/chatbot.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChatbotComponent], // Add the chatbot component
  template: `
    <div>
      <app-chatbot></app-chatbot>
      <!-- Rest of your app -->
    </div>
  `
})
export class AppComponent {}
```

### 2. Setup HTTP Interceptor

Add authorization header to all HTTP requests. Create an auth interceptor:

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request);
  }
}
```

Register in your app config:

```typescript
import { HTTP_INTERCEPTORS } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
};
```

### 3. Configure API URL

Set the API URL in your environment config:

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};

// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.terrasens.com'
};
```

Update the ChatService to use the environment:

```typescript
// In chatbot/services/chat.service.ts
import { environment } from 'environments/environment';

export class ChatService {
  private apiUrl = `${environment.apiUrl}/chat`;
  // ... rest of the service
}
```

---

## Component Features

### Message Sending

```typescript
// In your component
constructor(private chatService: ChatService) {}

sendMessage(message: string, parcelleId?: string) {
  this.chatService.sendMessage(message, parcelleId).subscribe({
    next: (response) => {
      console.log('Message sent:', response.data);
    },
    error: (error) => {
      console.error('Error:', error);
    }
  });
}
```

### Image Upload

```typescript
uploadImage(file: File, parcelleId?: string) {
  this.chatService.uploadImage(file, parcelleId).subscribe({
    next: (response) => {
      console.log('Disease detection:', response.data);
    },
    error: (error) => {
      console.error('Upload error:', error);
    }
  });
}
```

### Get Chat History

```typescript
loadHistory() {
  this.chatService.getConversationHistory(50, 0).subscribe({
    next: (response) => {
      console.log('History loaded:', response.data);
    },
    error: (error) => {
      console.error('Error loading history:', error);
    }
  });
}
```

---

## Styling & Customization

### Override CSS Variables

Create custom styles in your component or global styles:

```css
:root {
  /* Primary gradient colors */
  --chatbot-primary: #667eea;
  --chatbot-secondary: #764ba2;
  
  /* Alternative color scheme */
  --chatbot-primary: #4CAF50; /* Green for agriculture */
  --chatbot-secondary: #8BC34A;
  
  /* Or leaf-inspired colors */
  --chatbot-primary: #2E7D32;
  --chatbot-secondary: #558B2F;
}
```

### Modify Component Size

In `chatbot.component.css`:

```css
/* Desktop size */
.chat-window {
  width: 420px;  /* Adjust width */
  height: 600px; /* Adjust height */
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .chat-window.mobile {
    width: 100vw;
    height: 100vh;
  }
}
```

### Change Bubble Position

```css
.chatbot-container {
  bottom: 20px;  /* Distance from bottom */
  right: 20px;   /* Distance from right */
  /* Or use: left, top instead */
}
```

---

## Advanced Usage

### Listen to Chat State Changes

```typescript
constructor(private chatService: ChatService) {
  this.chatService.chatState$.subscribe(state => {
    console.log('Chat state:', state);
    console.log('Messages:', state.messages);
    console.log('Loading:', state.isLoading);
    console.log('Error:', state.error);
  });
}
```

### Get Only Messages

```typescript
messages$ = this.chatService.getMessages();
isLoading$ = this.chatService.isLoading();
error$ = this.chatService.getError();

// In template:
// <div *ngFor="let message of messages$ | async">
//   {{ message.content }}
// </div>
```

### Toggle Chat Programmatically

```typescript
// Open chat
this.chatService.toggleChat();

// Close chat (if open)
this.chatService.toggleChat();
```

### Clear History Programmatically

```typescript
clearAllHistory() {
  if (confirm('Are you sure?')) {
    this.chatService.clearHistory().subscribe({
      next: () => console.log('History cleared'),
      error: (err) => console.error('Error:', err)
    });
  }
}
```

---

## Integration Examples

### Example 1: In Dashboard

```typescript
import { Component } from '@angular/core';
import { ChatbotComponent } from './features/chatbot/components/chatbot.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ChatbotComponent],
  template: `
    <div class="dashboard">
      <header>
        <h1>Farmer Dashboard</h1>
      </header>
      
      <main>
        <!-- Your dashboard content -->
      </main>
      
      <!-- Chatbot floats over everything -->
      <app-chatbot></app-chatbot>
    </div>
  `,
  styles: [`
    .dashboard {
      position: relative;
      height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
  `]
})
export class DashboardComponent {}
```

### Example 2: With Parcel Selection

```typescript
@Component({
  selector: 'app-field-monitor',
  template: `
    <div>
      <select [(ngModel)]="selectedParcelleId">
        <option [value]="null">Select a parcel...</option>
        <option *ngFor="let parcel of parcelles" [value]="parcel.id">
          {{ parcel.name }}
        </option>
      </select>
      
      <!-- Chatbot with selected parcel -->
      <app-chatbot 
        [initialParcelleId]="selectedParcelleId"
      ></app-chatbot>
    </div>
  `
})
export class FieldMonitorComponent {
  selectedParcelleId: string | null = null;
  parcelles = [];
}
```

### Example 3: With Custom Styling

```typescript
@Component({
  selector: 'app-custom-chat',
  standalone: true,
  imports: [ChatbotComponent],
  template: `
    <div class="custom-container">
      <app-chatbot></app-chatbot>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      /* Override chatbot colors */
      .chat-bubble {
        background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
      }
      
      .chat-header {
        background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
      }
      
      .btn-send {
        background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
      }
      
      /* User messages in green */
      .message.user .message-content {
        background: #4CAF50;
      }
    }
  `]
})
export class CustomChatComponent {}
```

---

## Error Handling

### Network Errors

```typescript
private handleError(error: any): Observable<never> {
  console.error('Error occurred:', error);
  
  if (error.status === 0) {
    // Network error
    this.showNotification('Network error. Please check your connection.');
  } else if (error.status === 401) {
    // Unauthorized
    this.router.navigate(['/login']);
  } else if (error.status === 503) {
    // Service unavailable
    this.showNotification('Chatbot service is temporarily unavailable.');
  }
  
  return throwError(() => error);
}
```

### User-Friendly Error Messages

```typescript
getErrorMessage(error: any): string {
  if (error.error?.message) {
    return error.error.message;
  }
  
  switch (error.status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Please log in again.';
    case 404:
      return 'Resource not found.';
    case 500:
      return 'Server error. Please try again later.';
    case 503:
      return 'Service unavailable. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
}
```

---

## Performance Optimization

### Lazy Load Chatbot Component

```typescript
// app.routes.ts
const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canLoad: [() => import('./features/chatbot/components/chatbot.component')
      .then(() => true)
      .catch(() => false)]
  }
];
```

### Unsubscribe from Observables

```typescript
import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-chat-container'
})
export class ChatContainerComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(private chatService: ChatService) {
    this.chatService.chatState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        console.log('Chat state:', state);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

## Testing

### Unit Test Example

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ChatService]
    });

    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should send message and return response', () => {
    const mockResponse = {
      success: true,
      data: {
        conversationId: 'test-123',
        response: 'Test response',
        toolsUsed: [],
        timestamp: new Date().toISOString()
      }
    };

    service.sendMessage('test message').subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.data.response).toBe('Test response');
    });

    const req = httpMock.expectOne('/api/chat');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  afterEach(() => {
    httpMock.verify();
  });
});
```

---

## Mobile Considerations

### Responsive Design

The chatbot is fully responsive and automatically adapts to mobile screens:

- **Desktop:** 420px × 600px floating window
- **Mobile:** Full screen (100vw × 100vh)
- **Tablet:** Scales proportionally

### Touch Gestures

- **Tap:** Send message or toggle chat
- **Swipe Down:** Close chat on mobile (future enhancement)
- **Long Press:** Copy message text (future enhancement)

### Mobile Optimization

```css
@media (max-width: 768px) {
  .chatbot-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
  }

  .chat-window.mobile {
    border-radius: 0;
    width: 100vw;
    height: 100vh;
  }
}
```

---

## Accessibility

### ARIA Labels

```html
<button 
  class="chat-bubble"
  aria-label="Open chat with TerraSens AI assistant"
  aria-expanded="false"
  [attr.aria-expanded]="isOpen">
  <!-- Button content -->
</button>
```

### Keyboard Navigation

- **Tab:** Navigate between elements
- **Enter:** Send message (when focused on input)
- **Escape:** Close chat window (future enhancement)

### Screen Readers

All interactive elements have proper ARIA labels and descriptions for accessibility.

---

## Troubleshooting

### Chat not displaying

1. Verify `ChatbotComponent` is imported
2. Check browser console for errors
3. Ensure auth token is valid
4. Verify API Gateway is running

### Messages not sending

1. Check authentication token
2. Verify API Gateway is accessible
3. Check network tab in browser dev tools
4. Verify chatbot service is running: `curl http://localhost:3006/health`

### Images not uploading

1. Verify file is JPEG/PNG
2. Check file size (max 25MB)
3. Ensure uploads directory exists
4. Check file permissions

### Styling not applied

1. Verify CSS file is loaded
2. Check CSS specificity
3. Use `!important` if needed
4. Clear browser cache

---

## Support & Resources

- **API Documentation:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Backend Guide:** [README.md](./README.md)
- **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md)

---

**Last Updated:** April 24, 2024  
**Version:** 1.0.0
