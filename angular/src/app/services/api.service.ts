import { Injectable, Inject } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthResponse } from '../classes/auth';
import { User } from '../classes/user';
import { BROWSER_STORAGE } from '../classes/storage';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(
    private readonly http: HttpClient,
    @Inject(BROWSER_STORAGE) private storage: Storage,
  ) {}

  public login(
    credentials: Pick<User, 'username' | 'password'>,
  ): Observable<AuthResponse> {
    return this.makeAuthApiCall('login', credentials);
  }

  public register(payload: Partial<User>): Observable<AuthResponse> {
    return this.makeAuthApiCall('register', payload);
  }

  private makeAuthApiCall(
    urlPath: string,
    user: Partial<User>,
  ): Observable<AuthResponse> {
    const url: string = `${this.baseUrl}/${urlPath}`;

    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    return this.http
      .post<AuthResponse>(url, user, { headers })
      .pipe(retry(1), catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    const message = error.error?.message || error.statusText || 'Unknown error';
    return throwError(() => new Error(message));
  }
}
