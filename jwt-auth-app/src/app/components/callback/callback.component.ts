import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-container">
      <div class="card">
        <div class="loading-spinner"></div>
        <h2>Обробка автентифікації...</h2>
        <p>Зачекайте, будь ласка, відбувається перенаправлення</p>
      </div>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 70vh;
    }

    .card {
      background: rgba(255, 255, 255, 0.95);
      padding: 2rem;
      border-radius: 15px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      text-align: center;
      max-width: 400px;
      width: 100%;
    }

    .loading-spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    h2 {
      color: #333;
      margin-bottom: 1rem;
      font-weight: 300;
    }
  `]
})
export class CallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Отримуємо токен з URL параметрів або з fragment
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.authService.handleCallback(token);
        return;
      }
    });

    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        const urlParams = new URLSearchParams(fragment);
        const token = urlParams.get('token');
        if (token) {
          this.authService.handleCallback(token);
          return;
        }
      }
    });

    setTimeout(() => {
      if (!this.authService.isAuthenticated) {
        this.authService.logout();
      }
    }, 3000);
  }
}
