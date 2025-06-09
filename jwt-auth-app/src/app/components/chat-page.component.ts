import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

interface Message {
  id?: number;
  chatId: number;
  senderId: number;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

interface ChatWithUserResponse {
  id: number;
  otherUserName: string;
}

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="main-container">
      <div class="sidebar">
        <h3>Мої чати</h3>
        <ul>
          <li *ngFor="let chat of userChats" [routerLink]="['/chat', chat.id]" routerLinkActive="active">
            {{ chat.otherUserName }}
          </li>
        </ul>
      </div>
      <div class="chat-container">
        <h2>Чат №{{ chatId }}</h2>
        <div class="status" [ngClass]="{'connected': wsConnected, 'disconnected': !wsConnected}">
          Статус: {{ wsConnected ? 'Підключено' : 'Відключено' }}
        </div>

        <div class="messages" #messageContainer>
          <div *ngIf="loading" class="loading">Завантаження...</div>
          <div *ngFor="let message of messages" class="message" [ngClass]="{'own-message': message.senderId === currentUserId}">
            <strong>{{ userNames[message.senderId] || 'Користувач ' + message.senderId }}:</strong>

            <ng-container *ngIf="editingMessageId !== message.id">
              {{ message.content }}
              <div class="timestamp">
                {{ message.createdAt | date:'short' }}
                <span *ngIf="message.updatedAt"> (редаговано {{ message.updatedAt | date:'short' }})</span>
              </div>

              <div *ngIf="message.senderId === currentUserId && message.id != null" class="message-actions">
                <button class="edit-btn" (click)="startEditing(message.id, message.content)">Редагувати</button>
                <button class="delete-btn" (click)="deleteMessage(message.id)">Видалити</button>
              </div>
            </ng-container>

            <ng-container *ngIf="editingMessageId === message.id">
              <div class="edit-input-container">
                <input [(ngModel)]="editedMessageContent"
                       (keyup.enter)="saveEditedMessage(message.id)"
                       placeholder="Редагуйте повідомлення..." />
                <button (click)="saveEditedMessage(message.id)" style="background: #28a745; color: white;">Зберегти</button>
                <button (click)="cancelEditing()" style="background: #6c757d; color: white;">Скасувати</button>
              </div>
            </ng-container>
          </div>

        </div>

        <div class="input-box">
          <input
            [(ngModel)]="newMessage"
            (keyup.enter)="sendMessage()"
            placeholder="Введіть повідомлення..."
            [disabled]="!wsConnected"
          />
          <button (click)="sendMessage()" [disabled]="!wsConnected || !newMessage.trim()">Надіслати</button>
        </div>
        <div *ngIf="error" class="error">{{ error }}</div>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      max-width: 800px;
      margin: auto;
      padding: 2rem;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }
    .status {
      padding: 0.5rem;
      border-radius: 5px;
      margin-bottom: 1rem;
      text-align: center;
      font-size: 0.9rem;
    }
    .connected {
      background: #d4edda;
      color: #155724;
    }
    .disconnected {
      background: #f8d7da;
      color: #721c24;
    }
    .messages {
      height: 400px;
      overflow-y: auto;
      border: 1px solid #ccc;
      padding: 1rem;
      margin-bottom: 1rem;
      background-color: #f9f9f9;
    }
    .message {
      max-width: 70%;
      margin-bottom: 1rem;
      padding: 0.5rem;
      border-radius: 5px;
      position: relative;
      display: flex;
      flex-direction: column;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .message:not(.own-message) {
      align-self: flex-start;
      background: #f1f1f1;
    }

    /* Власні повідомлення */
    .own-message {
      background: #e3f2fd;
      align-self: flex-end;
      margin-left: auto;
    }
    .timestamp {
      font-size: 0.8rem;
      color: #888;
    }

    .message-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
      align-items: center;
    }

    .edit-btn, .delete-btn {
      margin-top: 0.5rem;
      padding: 5px 10px;
      border: none;
      color: white;
      border-radius: 5px;
      cursor: pointer;
      font-size: 0.8rem;
      //align-self: flex-start;
    }
    .edit-btn {
      background: #ffc107;
    }
    .edit-btn:hover {
      background: #e0a800;
    }
    .delete-btn {
      background: #dc3545;
    }
    .delete-btn:hover {
      background: #c82333;
    }
    .input-box {
      display: flex;
      gap: 1rem;
    }
    input {
      flex: 1;
      padding: 10px;
      border-radius: 5px;
      border: 1px solid #ccc;
    }
    input:disabled, button:disabled {
      background: #eee;
      cursor: not-allowed;
    }
    button {
      padding: 10px 20px;
      border: none;
      background: #34495e;
      color: white;
      border-radius: 5px;
      cursor: pointer;
    }
    button:hover {
      background-color: #2c3e50;
    }
    .loading, .error {
      text-align: center;
      padding: 1rem;
      color: #666;
    }
    .error {
      color: #721c24;
      background: #f8d7da;
      border-radius: 5px;
    }
    .main-container {
      display: flex;
    }
    .sidebar {
      width: 250px;
      padding: 1rem;
      background: #f1f1f1;
      border-right: 1px solid #ccc;
    }
    .sidebar ul {
      list-style: none;
      padding: 0;
    }
    .sidebar li {
      padding: 0.5rem;
      cursor: pointer;
    }
    .sidebar li.active {
      background-color: #ddd;
      font-weight: bold;
    }
    .chat-container {
      flex: 1;
    }
  `]
})
export class ChatPageComponent implements OnInit, OnDestroy, AfterViewInit {
  chatId!: number;
  messages: Message[] = [];
  newMessage = '';
  currentUserId: number | null = null;
  wsConnected = false;
  loading = false;
  error: string | null = null;
  private ws: WebSocket | null = null;
  private apiUrl = 'http://localhost:8082';
  userChats: ChatWithUserResponse[] = [];
  userNames: { [key: number]: string } = {};
  editingMessageId: number | null = null;
  editedMessageContent: string = '';

  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUserCached();
    this.currentUserId = user?.id || null;
    if (!this.currentUserId && this.authService.token) {
      try {
        const tokenPayload = JSON.parse(atob(this.authService.token.split('.')[1]));
        this.currentUserId = Number(tokenPayload.sub) || null;
        console.log('Parsed user ID from JWT:', this.currentUserId);
      } catch (e) {
        console.error('Failed to parse JWT for user ID:', e);
      }
    }
    if (!this.currentUserId) {
      console.error('Current user ID not found');
      this.error = 'Не вдалося визначити поточного користувача';
    }
    this.loadUserChats();
    this.route.paramMap.subscribe(params => {
      const newChatId = Number(params.get('chatId'));
      if (newChatId !== this.chatId) {
        this.chatId = newChatId;
        this.closeWebSocket();
        this.messages = [];
        this.loadMessages();
        this.initWebSocket();
      }
    });
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    this.closeWebSocket();
  }

  loadMessages(): void {
    this.loading = true;
    this.error = null;
    const token = this.authService.token;
    if (!token) {
      this.error = 'Авторизація потрібна для завантаження повідомлень';
      this.loading = false;
      return;
    }
    if (!this.chatId) {
      this.error = 'ID чату не визначено';
      this.loading = false;
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.get<Message[]>(`${this.apiUrl}/api/chats/${this.chatId}/messages`, { headers }).subscribe({
      next: (data) => {
        this.messages = data || [];
        this.loading = false;
        this.sortMessagesByCreatedAt();
        console.log('Завантажено повідомлень:', this.messages.length, 'для чату', this.chatId);
        this.loadUserNamesForMessages();
        setTimeout(() => this.scrollToBottom(), 0);
      },
      error: (err) => {
        this.error = `Не вдалося завантажити повідомлення: ${err.status} ${err.statusText}`;
        console.error('Помилка завантаження повідомлень для чату', this.chatId, ':', err);
        this.loading = false;
      }
    });
  }

  loadUserNamesForMessages(): void {
    const token = this.authService.token;
    if (!token) return;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    const uniqueSenderIds = [...new Set(this.messages.map(m => m.senderId))].filter(id => id != null);
    uniqueSenderIds.forEach(senderId => {
      if (!this.userNames[senderId]) {
        this.http.get<{ id: number, name: string }>(`http://localhost:8081/api/users/${senderId}`, { headers }).subscribe({
          next: (user) => {
            this.userNames[senderId] = user.name;
          },
          error: (err) => {
            console.error('Не вдалося завантажити ім’я користувача', senderId, ':', err);
            this.userNames[senderId] = `Користувач ${senderId}`;
          }
        });
      }
    });
  }

  initWebSocket(): void {
    const url = `ws://localhost:8082/api/ws/chat/${this.chatId}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.wsConnected = true;
      this.error = null;
      console.log('WebSocket підключено до чату', this.chatId);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data); // Додайте цей лог для діагностики

        // Обробка видалення повідомлення
        if ((data.action === 'delete' || data.type === 'message_delete') && data.messageId) {
          this.messages = this.messages.filter(m => m.id !== data.messageId);
          console.log('Повідомлення видалено через WebSocket:', data.messageId);
          setTimeout(() => this.scrollToBottom(), 0);
        }
        // Обробка редагування повідомлення
        else if ((data.action === 'edit' || data.type === 'message_edit') && (data.id || data.messageId)) {
          const messageId = data.id || data.messageId;
          const index = this.messages.findIndex(m => m.id === messageId);

          if (index !== -1) {
            this.messages[index] = {
              ...this.messages[index],
              content: data.content,
              updatedAt: data.updatedAt || new Date().toISOString()
            };
            console.log('Повідомлення відредаговано через WebSocket:', messageId);
            this.sortMessagesByCreatedAt();
            setTimeout(() => this.scrollToBottom(), 0);
          } else {
            console.log('Повідомлення для редагування не знайдено:', messageId);
          }
        }
        // Обробка нового повідомлення
        else if (!data.action && !data.type && data.chatId === this.chatId && data.id) {
          const exists = this.messages.some(m => m.id === data.id);
          if (!exists) {
            this.messages.push(data);
            this.sortMessagesByCreatedAt();
            this.loadUserNamesForMessages();
            console.log('Нове повідомлення додано через WebSocket:', data.id);
            setTimeout(() => this.scrollToBottom(), 0);
          }
        }
        // Альтернативна обробка для нових повідомлень з типом
        else if (data.type === 'new_message' && data.chatId === this.chatId && data.id) {
          const exists = this.messages.some(m => m.id === data.id);
          if (!exists) {
            this.messages.push(data);
            this.sortMessagesByCreatedAt();
            this.loadUserNamesForMessages();
            console.log('Нове повідомлення додано через WebSocket:', data.id);
            setTimeout(() => this.scrollToBottom(), 0);
          }
        } else {
          console.log('Ігноруємо повідомлення:', data);
        }
      } catch (e) {
        console.error('Помилка парсингу повідомлення:', e);
      }
    };

    this.ws.onerror = (event) => {
      this.wsConnected = false;
      this.error = 'Помилка WebSocket: не вдалося підключитися';
      console.error('WebSocket error for URL:', url, 'Event:', event);
    };

    this.ws.onclose = (event) => {
      this.wsConnected = false;
      this.error = `З'єднання втрачено (код: ${event.code}, причина: ${event.reason})`;
      console.log('WebSocket закрито:', event);
      setTimeout(() => {
        if (!this.wsConnected) {
          console.log('Спроба повторного підключення до WebSocket для чату', this.chatId);
          this.initWebSocket();
        }
      }, 3000);
    };
  }

  closeWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.wsConnected || !this.ws || !this.currentUserId) {
      this.error = !this.currentUserId ? 'Не вдалося визначити користувача' : 'Немає підключення або порожнє повідомлення';
      return;
    }

    const token = this.authService.token;
    if (!token) {
      this.error = 'Авторизація потрібна для відправки повідомлень';
      return;
    }

    const payload = {
      chatId: this.chatId,
      senderId: this.currentUserId,
      content: this.newMessage,
      createdAt: new Date().toISOString()
    };

    this.ws.send(JSON.stringify(payload));
    this.newMessage = '';
    this.scrollToBottom();
  }

  startEditing(messageId: number, content: string): void {
    this.editingMessageId = messageId;
    this.editedMessageContent = content;
  }

  cancelEditing(): void {
    this.editingMessageId = null;
    this.editedMessageContent = '';
  }

  saveEditedMessage(messageId: number): void {
    if (!this.editedMessageContent.trim() || !this.wsConnected || !this.currentUserId) {
      this.error = !this.currentUserId ? 'Не вдалося визначити користувача' : 'Немає підключення або порожнє повідомлення';
      return;
    }

    const token = this.authService.token;
    if (!token) {
      this.error = 'Авторизація потрібна для редагування повідомлень';
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const payload = {
      content: this.editedMessageContent
    };

    this.http.put<Message>(`${this.apiUrl}/api/chats/${this.chatId}/messages/${messageId}`, payload, { headers }).subscribe({
      next: (updatedMessage) => {
        // Оновлюємо локальне повідомлення
        const index = this.messages.findIndex(m => m.id === messageId);
        if (index !== -1) {
          this.messages[index] = {
            ...this.messages[index],
            content: this.editedMessageContent,
            updatedAt: updatedMessage.updatedAt || new Date().toISOString()
          };
          console.log('Updated local message:', this.messages[index]);
          this.sortMessagesByCreatedAt();
        }

        // Відправляємо через WebSocket для інших користувачів
        // ВАЖЛИВО: перевірте, який формат очікує ваш сервер
        if (this.ws) {
          const editPayload = {
            type: 'message_edit', // або 'edit' - залежно від серверної логіки
            action: 'edit',
            messageId: messageId, // використовуємо messageId замість id
            id: messageId, // залишаємо обидва варіанти для сумісності
            chatId: this.chatId,
            senderId: this.currentUserId,
            content: this.editedMessageContent,
            updatedAt: updatedMessage.updatedAt || new Date().toISOString(),
            createdAt: this.messages[index]?.createdAt // додаємо оригінальну дату створення
          };

          console.log('Sending edit payload via WebSocket:', editPayload);
          this.ws.send(JSON.stringify(editPayload));
        }

        this.editingMessageId = null;
        this.editedMessageContent = '';
        this.scrollToBottom();
      },
      error: (err) => {
        this.error = `Не вдалося відредагувати повідомлення: ${err.status} ${err.statusText}`;
        console.error('Помилка редагування повідомлення', messageId, ':', err);
      }
    });
  }

  deleteMessage(messageId: number): void {
    if (!this.wsConnected || !this.currentUserId || messageId == null) {
      this.error = !this.currentUserId ? 'Не вдалося визначити користувача' : 'Немає підключення або невизначений ID повідомлення';
      console.error('Invalid messageId:', messageId);
      return;
    }

    const token = this.authService.token;
    if (!token) {
      this.error = 'Авторизація потрібна для видалення повідомлень';
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.delete(`${this.apiUrl}/api/chats/${this.chatId}/messages/${messageId}`, { headers }).subscribe({
      next: () => {
        this.messages = this.messages.filter(m => m.id !== messageId);
        console.log('Повідомлення', messageId, 'успішно видалено');
        if (this.ws) {
          const deletePayload = {
            action: 'delete',
            messageId: messageId,
            chatId: this.chatId
          };
          this.ws.send(JSON.stringify(deletePayload));
        }
        this.scrollToBottom();
      },
      error: (err) => {
        this.error = `Не вдалося видалити повідомлення: ${err.status} ${err.statusText}`;
        console.error('Помилка видалення повідомлення', messageId, ':', err);
      }
    });
  }

  loadUserChats(): void {
    const token = this.authService.token;
    if (!token) {
      console.error('Токен не знайдено');
      this.error = 'Авторизація потрібна для завантаження чатів';
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.get<ChatWithUserResponse[]>(`${this.apiUrl}/api/chats`, { headers }).subscribe({
      next: (data) => {
        this.userChats = data;
        console.log('Завантажено чати:', this.userChats);
      },
      error: (err) => {
        console.error('Не вдалося завантажити чати:', err);
        this.error = `Не вдалося завантажити чати: ${err.status} ${err.statusText}`;
      }
    });
  }

  private scrollToBottom(): void {
    if (this.messageContainer) {
      this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
    }
  }

  private sortMessagesByCreatedAt(): void {
    this.messages.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateA.getTime() - dateB.getTime();
    });
  }

}
