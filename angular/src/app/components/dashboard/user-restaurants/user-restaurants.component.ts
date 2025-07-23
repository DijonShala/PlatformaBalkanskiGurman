import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestaurantService } from '../../../services/restaurant.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { UserService } from '../../../services/user.service';
import { UserRestaurantDetailComponent } from '../user-restaurant-detail/user-restaurant-detail.component';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FilterService } from '../../../services/filter.service';

@Component({
  selector: 'app-user-restaurants',
  standalone: true,
  imports: [CommonModule, FormsModule, UserRestaurantDetailComponent, RouterLink],
  templateUrl: './user-restaurants.component.html',
  styleUrls: ['./user-restaurants.component.scss']
})
export class UserRestaurantsComponent implements OnInit, OnDestroy {
  restaurants: any[] = [];
  users: any[] = [];
  userId!: number;
  selectedUserId: number | null = null;
  loading = true;
  error = '';
  selectedRestaurant: any = null;
  baseRoute: string = '/dashboard/restaurants';

  page = 1;
  limit = 10;
  totalPages = 1;

  private subscriptions: Subscription[] = [];

  constructor(
    private restaurantService: RestaurantService,
    protected authService: AuthenticationService,
    private userService: UserService,
    private filterService: FilterService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.baseRoute = currentUser.role === 'admin'
      ? '/admin/restaurants'
      : '/dashboard/restaurants';

    this.userId = currentUser.id;

    if (currentUser.role === 'admin') {
      this.loadAllUsers();
    } else {
      this.selectedUserId = this.userId;
      this.page = this.filterService.getPage() || 1;
      this.fetchRestaurants(this.page);
    }
  }

  loadAllUsers(): void {
    this.userService.getAllUsers(1, 100).subscribe({
      next: (res: any) => {
        this.users = res.data || [];
        if (this.users.length > 0) {
          this.selectedUserId = this.users[0].id;
          this.page = this.filterService.getPage() || 1;
          this.fetchRestaurants(this.page);
        }
      },
      error: () => {
        this.error = 'Failed to load users.';
      }
    });
  }

  onUserChange(): void {
    if (!this.selectedUserId) return;
    this.page = 1; // reset page when user changes
    this.filterService.setPage(this.page);
    this.fetchRestaurants(this.page);
  }

  fetchRestaurants(page: number = 1): void {
    if (!this.selectedUserId) return;

    this.loading = true;
    this.error = '';
    this.page = page;
    this.filterService.setPage(page);

    this.subscriptions.push(
      this.restaurantService.getRestaurantsByUserId(this.selectedUserId, page, this.limit).subscribe({
        next: res => {
          this.restaurants = res.data || [];
          this.totalPages = res.totalPages || 1;
          this.loading = false;
        },
        error: err => {
          this.error = err.error?.message || 'Failed to load restaurants.';
          this.loading = false;
        }
      })
    );
  }

  selectRestaurant(restaurant: any): void {
    this.selectedRestaurant = restaurant;
  }

  refreshList(): void {
    this.fetchRestaurants(this.page);
    this.selectedRestaurant = null;
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.filterService.setPage(this.page);
      this.fetchRestaurants(this.page);
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.filterService.setPage(this.page);
      this.fetchRestaurants(this.page);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
