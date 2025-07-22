import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { User } from '../../../classes/user';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  pageSize = 10;
  loading = false;
  error: string | null = null;

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchUsers(this.currentPage);
  }

  fetchUsers(page: number): void {
    this.loading = true;
    this.error = null;

    this.userService.getAllUsers(page, this.pageSize).subscribe({
      next: res => {
        this.users = res.data;
        this.currentPage = res.currentPage;
        this.totalPages = res.totalPages;
        this.totalItems = res.totalItems;
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Failed to load users.';
        this.loading = false;
      }
    });
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.fetchUsers(this.currentPage + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.fetchUsers(this.currentPage - 1);
    }
  }

  goToUser(id: number): void {
  this.router.navigate(['/admin/users', id]);
  }
}
