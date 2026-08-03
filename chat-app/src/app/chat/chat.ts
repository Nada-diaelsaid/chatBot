import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Message } from '../interfaces/message';
import { ChatService } from '../services/chat/chat.service';

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

  private chatContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  private chatService = inject(ChatService);

  constructor() {
    // Keep the chat history pinned to the latest message whenever it changes.
    effect(() => {
      this.history();
      this.loading();
      if (this.history().length > 0) this.scrollToBottomChatContainer();
    });
  }

  private scrollToBottomChatContainer(): void {
    const container = this.chatContainer();

    if (container) {
      // We use a small timeout to ensure that the DOM has been updated
      // with the new message before we try to scroll.
      setTimeout(
        () => (container.nativeElement.scrollTop = container.nativeElement.scrollHeight),
        0
      );
    }
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

        // const reply = 
        // 'lorem ipsum dolor sit amet, consectetur adipiscing elit. lorem ipsum dolor sit amet, consectetur adipiscing elit.';
        const reply = await this.chatService.sendMessageToLLM(userMessage?.text);

        const newBotMessage: Message = {
          id: Date.now()+1,
          sender: 'bot', 
          text: reply 
        };

        // get response from LLM
        // const reply = await this.chatService.sendMessageToLLM(userMessage?.text);
        // Placeholder response simulation - replace with a real API call.
        setTimeout(() => {
          this.history.update((messages) => [...messages, newBotMessage]);

          this.loading.set(false);
        }, 1600);
     

      } catch (error: any) {
        console.error('Error communicating with LLM:', error);
        this.error.set(error?.message);
        // this.loading.set(false);
      }
      finally {
        this.loading.set(false);

      }
    }
  }
