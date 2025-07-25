import { Injectable, Inject } from '@angular/core';
import { BROWSER_STORAGE } from '../classes/storage';
import { AuthResponse } from '../classes/auth';
import { ApiService } from './api.service';
import { Observable, tap } from 'rxjs';
import { User } from '../classes/user';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  constructor(
    @Inject(BROWSER_STORAGE) private readonly storage: Storage,
    private readonly apiService: ApiService
  ) {}

  public login(user: Pick<User, 'username' | 'password'>): Observable<AuthResponse> {
    return this.apiService.login(user).pipe(
      tap((response: AuthResponse) => this.saveToken(response.token))
    );
  }

  public register(user: Partial<User>): Observable<AuthResponse> {
    return this.apiService.register(user).pipe(
      tap((response: AuthResponse) => this.saveToken(response.token))
    );
  }

  public saveToken(token: string): void {
    this.storage.setItem('jwt-token', token);
  }

  public getToken(): string | null {
    return this.storage.getItem('jwt-token');
  }

  public logout(): void {
    this.storage.removeItem('jwt-token');
  }

  private b64Utf8(input: string): string {
    return decodeURIComponent(
      Array.prototype.map
        .call(window.atob(input), (character: string) => {
          return '%' + ('00' + character.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
  }

  public isLoggedIn(): boolean {
    const token: string | null = this.getToken();
    if (token) {
      const payload = JSON.parse(this.b64Utf8(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    }
    return false;
  }

  public getCurrentUser(): User | null {
    if (this.isLoggedIn()) {
      const token = this.getToken();
      if (token) {
        const payload = JSON.parse(this.b64Utf8(token.split('.')[1]));
        return new User({
          id: payload.id,
          username: payload.username,
          firstname: payload.firstname,
          role: payload.role,
        });
      }
    }
    return null;
  }
}
