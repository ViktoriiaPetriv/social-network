import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { UserDto, UserService } from "./user.service";

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenSubject = new BehaviorSubject<string | null>(this.getStoredToken());
  public token$ = this.tokenSubject.asObservable();

  private userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();

  private currentUser: UserDto | null = null;

  constructor(private router: Router, private http: HttpClient, private userService: UserService) {
    this.loadUserFromToken();
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  get token(): string | null {
    return this.tokenSubject.value;
  }

  get isAuthenticated(): boolean {
    const token = this.token;
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Math.floor(Date.now() / 1000);
    } catch {
      return false;
    }
  }

  login(): void {
    const loginWindow = window.open('http://localhost:8080/oauth2/authorize/google', '_blank', 'width=500,height=600');

    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== 'http://localhost:8080') return;
      const token = event.data?.token;
      if (token) {
        localStorage.setItem('jwt_token', token);
        this.tokenSubject.next(token);
        window.removeEventListener('message', messageHandler);
        this.onLoginSuccess();
      }
    };

    window.addEventListener('message', messageHandler);

    const checkClosed = setInterval(() => {
      try {
        if (!loginWindow || loginWindow.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
        }
      } catch (e) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
      }
    }, 1000);
  }

  getCurrentUserCached(): UserDto | null {
    return this.currentUser;
  }

  setCurrentUser(user: UserDto | null): void {
    this.currentUser = user;
  }

  private onLoginSuccess(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.setCurrentUser(user);
        if (this.userService.isProfileSetupRequired(user)) {
          this.router.navigate(['/profile-setup']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        console.error('Failed to load user profile:', error);
        this.router.navigate(['/profile-setup']);
      }
    });
    console.log('Login successful, user authenticated');
  }

  logout(): void {
    this.http.post('http://localhost:8080/auth/logout', {}, {
      withCredentials: true,
      responseType: 'text'
    }).subscribe({
      next: () => {
        console.log('Server logout successful');
        this.clearClientSession();
      },
      error: (error) => {
        console.error('Logout error:', error);
        this.clearClientSession();
      }
    });
  }

  private clearClientSession(): void {
    localStorage.removeItem('jwt_token');
    this.tokenSubject.next(null);
    this.setCurrentUser(null);
    this.router.navigate(['/']);
    window.location.reload();
  }

  handleCallback(token: string): void {
    localStorage.setItem('jwt_token', token);
    this.tokenSubject.next(token);
    this.onLoginSuccess();
  }

  getUserInfo(): UserDto | null {
    const token = this.token;
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        role: payload.role
      };
    } catch {
      return null;
    }
  }

  private loadUserFromToken(): void {
    const token = this.token;
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        role: payload.role
      };
      this.userSubject.next(user);
    } catch {
      this.userSubject.next(null);
    }
  }
}
