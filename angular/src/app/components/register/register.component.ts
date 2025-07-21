import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthenticationService } from '../../services/authentication.service';
import { ConnectionService } from '../../services/connection.service';
import { HistoryService } from '../../services/history.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  public formError: string = '';

  public credentials = {
    username: '',
    email: '',
    firstname: '',
    lastname: '',
    password: '',
  };

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService,
    private connectionService: ConnectionService,
    private historyService: HistoryService
  ) {}

  public onRegisterSubmit(): void {
    const { username, email, password, firstname, lastname } = this.credentials;
    this.formError = '';

    if (
      !username.trim() ||
      !email.trim() ||
      !password.trim() ||
      !firstname.trim() ||
      !lastname.trim()
    ) {
      this.formError = 'All fields are required.';
      return;
    }

    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      this.formError = 'Please enter a valid email address.';
      return;
    }

    if (password.length < 3) {
      this.formError = 'Password must be at least 3 characters long.';
      return;
    }


    this.doRegister();
  }

  private doRegister(): void {
    this.authenticationService
      .register(this.credentials)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.formError = error.error?.message || 'Registration failed.';
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
