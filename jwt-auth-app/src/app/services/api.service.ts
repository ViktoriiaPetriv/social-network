import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8082/api';

  constructor(private http: HttpClient) {}

  getPublicHello(): Observable<string> {
    return this.http.get(`${this.baseUrl}/public/hello`, { responseType: 'text' });
  }

  getProtectedHello(): Observable<string> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });

    return this.http.get(`${this.baseUrl}/hello`, { headers, responseType: 'text' });
  }

  getMessages(chatId: number): Observable<any[]> {
    const token = localStorage.getItem('jwt_token');
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });

    return this.http.get<any[]>(`${this.baseUrl}/messages/${chatId}`, { headers });
  }
}
