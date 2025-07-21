import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { AuthenticationService } from '../../services/authentication.service';
import { ConnectionService } from '../../services/connection.service';
import { HistoryService } from '../../services/history.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'], // optional
})
export class LoginComponent {
  protected formError: string = '';

  protected credentials = {
    username: '',
    password: '',
  };

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService,
    private connectionService: ConnectionService,
    private historyService: HistoryService
  ) {}

  public onLoginSubmit(): void {
    this.formError = '';

    const { username, password } = this.credentials;

    if (!username || !password) {
      this.formError = 'Both username and password are required.';
      return;
    }

    if (password.length < 3) {
      this.formError = 'Password must be at least 3 characters.';
      return;
    }

    this.doLogin();
  }

  private doLogin(): void {
    this.authenticationService
      .login({
        username: this.credentials.username,
        password: this.credentials.password,
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          // Display detailed error if available or fallback message
          this.formError = error.error?.message || error.message || 'Login failed. Please try again.';
          return throwError(() => error);
        })
      )
      .subscribe(() => {
        this.router.navigateByUrl(this.historyService.getLastNonLoginUrl());
      });
  }

  public isConnected(): boolean {
    return this.connectionService.isConnected;
  }
}
