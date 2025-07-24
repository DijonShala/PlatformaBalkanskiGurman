import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { User } from '../../../classes/user';
import { FilterService } from '../../../services/filter.service';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatPaginatorModule} from '@angular/material/paginator';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatProgressSpinnerModule, MatPaginatorModule],
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
    private router: Router,
    private filterService: FilterService
  ) {}

  ngOnInit(): void {
    // Retrieve page from filterService, or default to 1
    this.currentPage = this.filterService.getPage() || 1;
    this.fetchUsers(this.currentPage);
  }

  fetchUsers(page: number): void {
    this.loading = true;
    this.error = null;

    // Store current page in filterService
    this.filterService.setPage(page);

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

  onPageChange(event: PageEvent): void {
  this.currentPage = event.pageIndex + 1;
  this.fetchUsers(this.currentPage);
  }

  goToUser(id: number): void {
    this.router.navigate(['/admin/users', id]);
  }
}
