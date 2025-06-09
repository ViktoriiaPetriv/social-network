import {Component, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import {Subscription, Subject, debounceTime, distinctUntilChanged, switchMap, of} from "rxjs";
import { UserService, UserDto } from '../../services/user.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="home-container">
      <div class="card" *ngIf="!authService.isAuthenticated">
        <h2>Ласкаво просимо!</h2>
        <p>Увійдіть в систему для доступу до функцій додатку</p>
        <button class="btn btn-primary" (click)="login()">
          Увійти
        </button>
        <div class="test-section">
          <h3>Тест публічного API:</h3>
          <button class="btn btn-secondary" (click)="testPublicApi()">
            Тестувати публічний ендпоінт
          </button>
          <div class="result" *ngIf="publicApiResult">
            <strong>Результат:</strong> {{ publicApiResult }}
          </div>
        </div>
      </div>

      <div class="card" *ngIf="authService.isAuthenticated">
        <div *ngIf="isLoadingUser" class="loading-container">
          <div class="spinner"></div>
          <p>Завантаження даних...</p>
        </div>

        <div *ngIf="!isLoadingUser && userInfo">
          <h2>Привіт, {{ userInfo.name || 'Користувач' }}!</h2>
          <div class="user-info">
            <p><strong>Id:</strong> {{ userInfo.id }}</p>
            <p><strong>Name:</strong> {{ userInfo.name }}</p>
            <p><strong>Email:</strong> {{ userInfo.email }}</p>
          </div>

          <div class="search-section">
            <h3>Пошук користувачів</h3>
            <div class="search-container">
              <input
                type="text"
                class="search-input"
                placeholder="Введіть ім'я для пошуку..."
                [(ngModel)]="searchQuery"
                (input)="onSearchInput($event)"
                [disabled]="isSearching"
              >
              <div class="search-loading" *ngIf="isSearching">
                <div class="small-spinner"></div>
              </div>
            </div>

            <div class="search-results" *ngIf="searchResults.length > 0 || (searchQuery && searchResults.length === 0 && !isSearching)">
              <div *ngIf="searchResults.length > 0" class="results-list">
                <h4>Знайдені користувачі ({{ searchResults.length }}):</h4>
                <div class="user-item" *ngFor="let user of searchResults" [routerLink]="['/users', user.id]">
                  <div class="user-avatar">
                    {{ user.name.charAt(0).toUpperCase() || 'U' }}
                  </div>
                  <div class="user-details">
                    <div class="user-name">{{ user.name }}</div>
                    <div class="user-email">{{ user.email }}</div>
                    <div class="user-role">{{ user.role }}</div>
                  </div>
                  <div class="user-id">#{{ user.id }}</div>
                </div>
              </div>

              <div *ngIf="searchQuery && searchResults.length === 0 && !isSearching" class="no-results">
                <p>Користувачів з ім'ям "{{ searchQuery }}" не знайдено</p>
              </div>
            </div>

            <div *ngIf="searchError" class="search-error">
              <p>{{ searchError }}</p>
              <button class="btn btn-small" (click)="retrySearch()">Спробувати знову</button>
            </div>
          </div>

          <div class="actions">
            <a routerLink="/chat" class="btn btn-primary">Перейти до чату</a>
            <button class="btn btn-secondary" (click)="logout()">Вийти</button>
          </div>
        </div>

        <div *ngIf="!isLoadingUser && error" class="error-container">
          <p class="error">{{ error }}</p>
          <button class="btn btn-secondary" (click)="retryLoadUser()">Спробувати знову</button>
        </div>

        <div *ngIf="!isLoadingUser && !userInfo && !error">
          <h2>Привіт!</h2>
          <div class="actions">
            <a routerLink="/chat" class="btn btn-primary">Перейти до чату</a>
            <button class="btn btn-secondary" (click)="logout()">Вийти</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
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
      max-width: 600px;
      width: 100%;
      backdrop-filter: blur(10px);
    }

    h2 {
      color: #333;
      margin-bottom: 1rem;
      font-weight: 300;
    }

    .user-info {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      margin: 1rem 0;
      text-align: left;
    }

    /* Стилі для пошуку */
    .search-section {
      margin: 2rem 0;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 10px;
      text-align: left;
    }

    .search-section h3 {
      margin-bottom: 1rem;
      color: #495057;
      text-align: center;
    }

    .search-container {
      position: relative;
      margin-bottom: 1rem;
    }

    .search-input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #dee2e6;
      border-radius: 25px;
      font-size: 1rem;
      outline: none;
      transition: border-color 0.3s ease;
      box-sizing: border-box;
    }

    .search-input:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .search-input:disabled {
      background-color: #f8f9fa;
      cursor: not-allowed;
    }

    .search-loading {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
    }

    .small-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .search-results {
      margin-top: 1rem;
    }

    .results-list h4 {
      color: #495057;
      margin-bottom: 1rem;
      font-size: 1.1rem;
    }

    .user-item {
      display: flex;
      align-items: center;
      padding: 12px;
      margin-bottom: 8px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e9ecef;
      transition: all 0.2s ease;
    }

    .user-item:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .user-details {
      flex: 1;
      text-align: left;
    }

    .user-name {
      font-weight: 600;
      color: #212529;
      margin-bottom: 2px;
    }

    .user-email {
      color: #6c757d;
      font-size: 0.9rem;
      margin-bottom: 2px;
    }

    .user-role {
      color: #667eea;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .user-id {
      color: #adb5bd;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .no-results {
      text-align: center;
      padding: 2rem;
      color: #6c757d;
    }

    .search-error {
      background: #f8d7da;
      color: #721c24;
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
    }

    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      font-size: 1rem;
      text-decoration: none;
      display: inline-block;
      transition: all 0.3s ease;
      font-weight: 500;
    }

    .btn-small {
      padding: 8px 16px;
      font-size: 0.9rem;
    }

    .btn-primary {
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
      transform: translateY(-2px);
    }

    .test-section {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }

    .result {
      margin-top: 1rem;
      padding: 1rem;
      background: #d4edda;
      border: 1px solid #c3e6cb;
      border-radius: 5px;
      color: #155724;
    }

    /* Стилі для завантаження */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Стилі для помилок */
    .error-container {
      padding: 1rem;
      text-align: center;
    }

    .error {
      color: #dc3545;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 5px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .card {
        margin: 1rem;
        padding: 1.5rem;
      }

      .user-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .user-avatar {
        margin-right: 0;
        margin-bottom: 0.5rem;
      }
    }
  `]
})

export class HomeComponent implements OnInit, OnDestroy {
  publicApiResult: string = '';
  userInfo: UserDto | null = null;
  error: string | null = null;
  isLoadingUser: boolean = false;

  // Змінні для пошуку
  searchQuery: string = '';
  searchResults: UserDto[] = [];
  isSearching: boolean = false;
  searchError: string | null = null;

  private searchSubject = new Subject<string>();
  private subscription: Subscription = new Subscription();

  constructor(
    public authService: AuthService,
    private apiService: ApiService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const tokenSub = this.authService.token$.subscribe(token => {
      if (token && this.authService.isAuthenticated) {
        // Коли токен з'явився, завантажуємо дані користувача з API
        this.loadCurrentUser();
      } else {
        // Коли токен зник, очищуємо дані
        this.userInfo = null;
        this.error = null;
        this.isLoadingUser = false;
        this.resetSearch();
      }
    });

    this.subscription.add(tokenSub);

    const searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.trim().length === 0) {
          return of([]);
        }

        this.isSearching = true;
        this.searchError = null;

        return this.userService.searchUsers(query.trim());
      })
    ).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.isSearching = false;
        this.searchError = null;
      },
      error: (err) => {
        console.error('Search error:', err);
        this.searchError = 'Помилка при пошуку користувачів';
        this.isSearching = false;
        this.searchResults = [];
      }
    });

    this.subscription.add(searchSub);

    if (this.authService.isAuthenticated) {
      this.loadCurrentUser();
    }
  }

  loadCurrentUser() {
    const cachedUser = this.authService.getCurrentUserCached();
    if (cachedUser) {
      this.userInfo = cachedUser;
      this.isLoadingUser = false;
      this.error = null;
      return;
    }

    this.isLoadingUser = true;
    this.error = null;

    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.userInfo = user;
        this.authService.setCurrentUser(user);
        this.error = null;
        this.isLoadingUser = false;
      },
      error: (err) => {
        this.error = 'Не вдалося завантажити дані користувача';
        this.isLoadingUser = false;
        console.error(err);
      }
    });
  }

  onSearchInput(event: any) {
    const query = event.target.value;
    this.searchQuery = query;

    if (!query || query.trim().length === 0) {
      this.resetSearch();
      return;
    }

    this.searchSubject.next(query);
  }

  resetSearch() {
    this.searchResults = [];
    this.isSearching = false;
    this.searchError = null;
  }

  retrySearch() {
    if (this.searchQuery && this.searchQuery.trim().length > 0) {
      this.searchSubject.next(this.searchQuery);
    }
  }

  retryLoadUser() {
    this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  login(): void {
    this.authService.login();
  }

  logout(): void {
    this.authService.logout();
  }

  testPublicApi(): void {
    this.apiService.getPublicHello().subscribe({
      next: (result) => {
        this.publicApiResult = result;
      },
      error: (error) => {
        this.publicApiResult = `Помилка: ${error.message}`;
      }
    });
  }
}
