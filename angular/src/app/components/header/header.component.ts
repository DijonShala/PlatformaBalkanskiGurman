import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AddRestaurantFormComponent } from '../add-restaurant-form/add-restaurant-form.component';
import { MatDialog } from '@angular/material/dialog';
import { RestaurantService } from '../../services/restaurant.service';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Output() mapToggle = new EventEmitter<void>();

  constructor(
    private dialog: MatDialog,
    private restaurantService: RestaurantService,
    public authService: AuthenticationService,
    private router: Router
  ) {}

  toggleMap() {
  this.router.navigate(['/map']);
}

  openAddRestaurantModal() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const dialogRef = this.dialog.open(AddRestaurantFormComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe((formData: FormData) => {
      if (formData) {
        this.restaurantService.createRestaurant(formData).subscribe({
          next: (res) => {
            console.log('Restaurant created:', res);
            this.restaurantService.triggerReload();
          },
          error: (err) => {
            console.error('Error creating restaurant:', err);
          }
        });
      }
    });
  }

  goToProfile() {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    const targetRoute = user.role === 'admin' ? '/admin' : '/dashboard';
    this.router.navigate([targetRoute]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
