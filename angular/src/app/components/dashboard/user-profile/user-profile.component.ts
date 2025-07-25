import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  userForm!: FormGroup;
  userId!: number;
  isAdmin = false;
  isSelf = false;
  alertMessage: string | null = null;
  alertType: string | null = null;


  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthenticationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.isAdmin = currentUser.role === 'admin';

    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      this.userId = idParam ? +idParam : currentUser.id;
      this.isSelf = !idParam || +idParam === currentUser.id;

      this.initForm();
      this.loadUserData();
    });
  }

  initForm(): void {
    this.userForm = this.fb.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['']
    });
  }

  loadUserData(): void {
    this.userService.getUserById(this.userId).subscribe({
      next: res => {
        if (res.data) {
          this.userForm.patchValue({
            firstname: res.data.firstname,
            lastname: res.data.lastname,
            username: res.data.username,
            email: res.data.email,
            role: res.data.role
          });

          if (!this.isAdmin) {
            this.userForm.get('role')?.disable();
          }
        } else {
          alert('No user data found');
        }
      },
      error: err => {
        alert(err.error?.message || 'Error loading user');
      }
    });
  }

  updateProfile(): void {
    if (this.userForm.invalid) return;

    const payload = this.userForm.getRawValue();
    if (!this.isAdmin) {
      delete payload.role;
    }

    this.userService.updateUser(this.userId, payload).subscribe({
      next: res => {
        this.alertType = 'succes';
        this.alertMessage = 'User updated suuccesfully';
        if (res.token && this.isSelf) {
          this.authService.saveToken(res.token);
        }
      },
      error: err => {
        this.alertType = 'error';
        this.alertMessage = err.error?.message || 'Updating the user has failed';
      }
    });
  }

  deleteAccount(): void {
    if (!confirm('Are you sure you want to delete this profile? This action is permanent.')) return;

    this.userService.deleteUser(this.userId).subscribe({
      next: () => {
        if (this.isSelf) {
          this.authService.logout();
          this.router.navigate(['/']);
        } else {
          this.router.navigate(['/admin/users']);
        }
      },
      error: err => {
        this.alertType = 'error';
        this.alertMessage = err.error?.message || 'Profile deletion error';
      }
    });
  }
}
