import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import {UserDto, UserService} from "../../services/user.service";

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="chat-container">
      <div class="chat-header">
        <h2>Чат сторінка</h2>
        <div class="user-info">
          Увійшов як: <strong>{{ userInfo?.name }}</strong>
          <button class="btn btn-sm" (click)="logout()">Вийти</button>
        </div>
      </div>

      <div class="chat-content">
        <div class="api-section">
          <h3>Тест API ендпоінтів:</h3>

          <div class="api-test">
            <button class="btn btn-primary" (click)="testPublicApi()">
              Публічний ендпоінт
            </button>
            <div class="result" *ngIf="publicResult">
              <strong>Публічний результат:</strong> {{ publicResult }}
            </div>
          </div>

          <div class="api-test">
            <button class="btn btn-success" (click)="testProtectedApi()">
              Захищений ендпоінт (з токеном)
            </button>
            <div class="result" *ngIf="protectedResult">
              <strong>Захищений результат:</strong> {{ protectedResult }}
            </div>
            <div class="error" *ngIf="protectedError">
              <strong>Помилка:</strong> {{ protectedError }}
            </div>
          </div>
        </div>

        <div class="navigation">
          <a routerLink="/" class="btn btn-secondary">Назад на головну</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      max-width: 800px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }

    .chat-header {
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chat-header h2 {
      margin: 0;
      font-weight: 300;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .chat-content {
      padding: 2rem;
    }

    .api-section h3 {
      color: #333;
      margin-bottom: 1.5rem;
    }

    .api-test {
      margin-bottom: 2rem;
      padding: 1.5rem;
      border: 1px solid #eee;
      border-radius: 10px;
      background: #f8f9fa;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.3s ease;
      font-weight: 500;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 0.8rem;
    }

    .btn-primary {
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
    }

    .btn-success {
      background: #28a745;
      color: white;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }

    .result {
      margin-top: 1rem;
      padding: 1rem;
      background: #d4edda;
      border: 1px solid #c3e6cb;
      border-radius: 5px;
      color: #155724;
    }

    .error {
      margin-top: 1rem;
      padding: 1rem;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 5px;
      color: #721c24;
    }

    .navigation {
      text-align: center;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #eee;
    }
  `]
})
export class ChatComponent implements OnInit {
  userInfo: UserDto | null = null;
  publicResult: string = '';
  protectedResult: string = '';
  protectedError: string = '';

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.userInfo = this.authService.getCurrentUserCached();
  }

  testPublicApi(): void {
    this.publicResult = '';
    this.apiService.getPublicHello().subscribe({
      next: (result) => {
        this.publicResult = result;
      },
      error: (error) => {
        this.publicResult = `Помилка: ${error.message}`;
      }
    });
  }

  testProtectedApi(): void {
    this.protectedResult = '';
    this.protectedError = '';

    this.apiService.getProtectedHello().subscribe({
      next: (result) => {
        this.protectedResult = result;
      },
      error: (error) => {
        this.protectedError = `${error.status}: ${error.message}`;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
