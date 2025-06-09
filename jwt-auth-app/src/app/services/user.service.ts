import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';
import {map} from "rxjs/operators";
export interface UserDto {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface UpdateUserNameRequest {
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8081/api/me';

  constructor(private http: HttpClient) {}

  getCurrentUser(): Observable<UserDto> {
    const token = localStorage.getItem('jwt_token');

    return this.http.get<UserDto>(this.apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }


  updateUserName(name: string): Observable<UserDto> {
    const token = localStorage.getItem('jwt_token');
    const userId = this.getUserIdFromToken(token);
    const request: UpdateUserNameRequest = { name };

    if (!userId) throw new Error('User ID not found in token');

    return this.http.put<UserDto>(`http://localhost:8081/api/users/${userId}`, request, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  private getUserIdFromToken(token: string | null): number | null {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return +payload.sub;
    } catch {
      return null;
    }
  }

  isProfileSetupRequired(user: UserDto | null): boolean {
    if (!user) return false;

    return !user.name ||
      user.name.trim() === '' ||
      user.name === user.email ||
      user.name.includes('@');
  }

  searchUsers(nameQuery: string): Observable<UserDto[]> {
    const token = localStorage.getItem('jwt_token');
    const currentUserId = this.getUserIdFromToken(token);

    if (!token) {
      return throwError(() => new Error('Authentication required'));
    }

    const params = new HttpParams().set('pattern', nameQuery);

    return this.http.get<UserDto[]>(`http://localhost:8081/api/users/search`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).pipe(
      map(users => users.filter(user => user.id !== currentUserId)),
      catchError(error => {
        console.error('Error searching users:', error);
        return throwError(() => error);
      })
    );
  }

  getUserById(id: string) {
    const token = localStorage.getItem('jwt_token');
    return this.http.get<UserDto>(`http://localhost:8081/api/users/${id}`, { headers:{
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
      } });
  }
}
