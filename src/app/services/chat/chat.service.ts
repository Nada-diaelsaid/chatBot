import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Service()
export class ChatService {
    url = environment.serverUrl;

    private http = inject(HttpClient);
    async sendMessageToLLM(message: string) : Promise<string> {
        try {
            const {reply} = await firstValueFrom(this.http.post<{reply: string}>(
                `${this.url}`+'chat', 
                {message}));
            return reply;
        }
        catch (error: any) {
            console.error('Error sending message to LLM:', error);
            throw error;
        }
    }
}
