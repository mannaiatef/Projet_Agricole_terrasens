import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatMessage } from '../models/app.models';

@Injectable({
    providedIn: 'root'
})
export class ChatbotService {
    private apiUrl = `${environment.apiUrl}/chat`;

    constructor(private http: HttpClient) { }

    sendMessage(message: string, farmId?: number): Observable<ChatMessage> {
        return this.http.post<ChatMessage>(this.apiUrl, { message, farm_id: farmId });
    }
}
