import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService, UserDto } from '../services/user.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-container" *ngIf="user">
      <h2>Профіль користувача</h2>
      <p><strong>Ім’я:</strong> {{ user.name }}</p>
      <p><strong>Email:</strong> {{ user.email }}</p>
      <p><strong>Роль:</strong> {{ user.role }}</p>
    </div>
    <div class="actions">
      <button class="btn btn-secondary" (click)="goBack()">Назад</button>
      <button class="btn btn-primary" (click)="startChat()">Створити чат</button>
    </div>
    <div *ngIf="!user && !error" class="loading">Завантаження...</div>
    <div *ngIf="error" class="error">{{ error }}</div>
  `,
  styles: [`
    .profile-container {
      padding: 2rem;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      max-width: 600px;
      margin: 2rem auto;
    }
    .loading, .error {
      text-align: center;
      margin-top: 2rem;
      font-size: 1.2rem;
      color: #666;
    }
    .error {
      color: red;
    }
    .actions {
      margin-top: 1.5rem;
      display: flex;
      gap: 1rem;
      justify-content: center;
    }
    .btn {
      padding: 10px 20px;
      border-radius: 25px;
      border: none;
      cursor: pointer;
    }
    .btn-primary {
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
    }
    .btn-secondary {
      background: #6c757d;
      color: white;
    }
  `]
})
export class UserProfileComponent implements OnInit {
  userId!: number;
  user: UserDto | null = null;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.userService.getUserById(userId).subscribe({
        next: (user) => this.user = user,
        error: () => this.error = 'Не вдалося завантажити користувача.'
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }


  startChat(): void {
    const token = localStorage.getItem('jwt_token');
    const currentUserId = this.userService['getUserIdFromToken'](token);
    const withUserId = this.user?.id;

    if (!currentUserId || !withUserId) {
      console.error("Missing IDs");
      return;
    }

    const body = {
      firstUserId: currentUserId,
      secondUserId: withUserId
    };

    this.http.post<any>('http://localhost:8082/api/chat', body, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).subscribe({
      next: (chat) => {
        this.router.navigate(['/chat', chat.id]);
      },
      error: (err) => {
        console.error("Не вдалося створити чат:", err);
      }
    });
  }


}
