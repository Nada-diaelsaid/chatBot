import { Component, ElementRef, effect, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Message } from '../interfaces/message';

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  history = signal<Message[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  message = signal('');

  private scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  constructor() {
    // Keep the chat history pinned to the latest message whenever it changes.
    effect(() => {
      this.history();
      this.loading();
      queueMicrotask(() => this.scrollToBottom());
    });
  }

  sendMessage(): void {
    const text = this.message().trim();

    
    if (!text || this.loading()) {
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: text
    };

    this.history.update((messages) => [...messages, userMessage]);
    this.message.set('');
    this.askLLM(userMessage);
  }
    async askLLM(userMessage: Message) : Promise<void>
    {
      try {
        this.loading.set(true);
        this.error.set(null);
    
        // get response from LLM
        // await this.chat.
        // Placeholder response simulation - replace with a real API call.
        setTimeout(() => {
          this.history.update((messages) => [
            ...messages,
            { 
              id: Date.now()+1,
              sender: 'bot', 
              text: `You said: "${text}". This is a simulated response.` },
          ]);
          this.loading.set(false);
        }, 1600);

      } catch (error) {
        this.error.set(error as string);
        // this.loading.set(false);
      }
      finally {
        this.loading.set(false);

      }
    }
  

  private scrollToBottom(): void {
    const element = this.scrollContainer()?.nativeElement;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }
}
