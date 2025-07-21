import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestaurantService } from '../../../services/restaurant.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { UserService } from '../../../services/user.service';
import { UserRestaurantDetailComponent } from '../user-restaurant-detail/user-restaurant-detail.component';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-restaurants',
  standalone: true,
  imports: [CommonModule, FormsModule, UserRestaurantDetailComponent, RouterLink],
  templateUrl: './user-restaurants.component.html',
  styleUrls: ['./user-restaurants.component.scss']
})
export class UserRestaurantsComponent implements OnInit {
  restaurants: any[] = [];
  users: any[] = [];
  userId!: number;
  selectedUserId: number | null = null;
  loading = true;
  error = '';
  selectedRestaurant: any = null;
  baseRoute: string = '/dashboard/restaurants'; // Default

  constructor(
    private restaurantService: RestaurantService,
    protected authService: AuthenticationService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
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
      this.fetchRestaurants();
    }
  }

 loadAllUsers(): void {
  this.userService.getAllUsers(1, 100).subscribe({
    next: (res: any) => {
      this.users = res.data || [];
      if (this.users.length > 0) {
        this.selectedUserId = this.users[0].id;
        this.fetchRestaurants();
      }
    },
    error: () => {
      this.error = 'Failed to load users.';
    }
  });
}

  onUserChange(): void {
    if (!this.selectedUserId) return;
    this.fetchRestaurants();
  }

  fetchRestaurants(): void {
    if (!this.selectedUserId) return;
    this.restaurants = []; 
    this.loading = true;
    this.restaurantService.getRestaurantsByUserId(this.selectedUserId).subscribe({
      next: res => {
        this.restaurants = res.data || [];
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Failed to load restaurants.';
        this.loading = false;
      }
    });
  }

  selectRestaurant(restaurant: any): void {
    this.selectedRestaurant = restaurant;
  }

  refreshList(): void {
    this.fetchRestaurants();
    this.selectedRestaurant = null;
  }
}
