import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService, UserDto } from '../services/user.service';

@Component({
  selector: 'app-profile-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="setup-container">
      <div class="card">
        <h2>Налаштування профілю</h2>
        <p>Будь ласка, введіть ваше ім'я для завершення реєстрації</p>

        <form (ngSubmit)="onSubmit()" #setupForm="ngForm">
          <div class="form-group">
            <label for="name">Ім'я користувача:</label>
            <input
              type="text"
              id="name"
              name="name"
              [(ngModel)]="userName"
              #nameInput="ngModel"
              required
              minlength="2"
              maxlength="50"
              class="form-control"
              [class.is-invalid]="nameInput.invalid && nameInput.touched"
              placeholder="Введіть ваше ім'я"
            >
            <div class="invalid-feedback" *ngIf="nameInput.invalid && nameInput.touched">
              <small *ngIf="nameInput.errors?.['required']">Ім'я є обов'язковим</small>
              <small *ngIf="nameInput.errors?.['minlength']">Ім'я повинно містити мінімум 2 символи</small>
              <small *ngIf="nameInput.errors?.['maxlength']">Ім'я не може перевищувати 50 символів</small>
            </div>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="setupForm.invalid || isLoading"
            >
              <span *ngIf="isLoading" class="spinner-small"></span>
              {{ isLoading ? 'Збереження...' : 'Зберегти' }}
            </button>
          </div>
        </form>

        <div class="error" *ngIf="error">
          {{ error }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .setup-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }

    .card {
      background: rgba(255, 255, 255, 0.95);
      padding: 2rem;
      border-radius: 15px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      text-align: center;
      max-width: 400px;
      width: 100%;
      backdrop-filter: blur(10px);
    }

    h2 {
      color: #333;
      margin-bottom: 0.5rem;
      font-weight: 300;
    }

    p {
      color: #666;
      margin-bottom: 2rem;
      line-height: 1.5;
    }

    .form-group {
      margin-bottom: 1.5rem;
      text-align: left;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #333;
      font-weight: 500;
    }

    .form-control {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s ease;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-control.is-invalid {
      border-color: #dc3545;
    }

    .invalid-feedback {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .form-actions {
      margin-top: 2rem;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      transition: all 0.3s ease;
      position: relative;
      min-width: 120px;
    }

    .btn-primary {
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .spinner-small {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 8px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error {
      color: #dc3545;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 5px;
      padding: 1rem;
      margin-top: 1rem;
      font-size: 0.875rem;
    }
  `]
})
export class ProfileSetupComponent implements OnInit {
  userName: string = '';
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/']);
      return;
    }

    const userInfo = this.authService.getUserInfo();
    if (userInfo?.name) {
      this.userName = userInfo.name;
    }
  }

  onSubmit(): void {
    if (this.userName.trim().length < 2) {
      this.error = 'Ім\'я повинно містити мінімум 2 символи';
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.userService.updateUserName(this.userName.trim()).subscribe({
      next: (updatedUser) => {
        this.authService.setCurrentUser(updatedUser);

        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error = 'Не вдалося зберегти дані. Спробуйте ще раз.';
        this.isLoading = false;
        console.error('Profile setup error:', err);
      }
    });
  }
}
