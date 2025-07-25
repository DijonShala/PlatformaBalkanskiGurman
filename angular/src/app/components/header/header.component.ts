import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';
import { filter } from 'rxjs/operators';
import { MatDialog} from '@angular/material/dialog';
import { AddRestaurantFormComponent } from '../add-restaurant-form/add-restaurant-form.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Output() mapToggle = new EventEmitter<void>();
  isMenuOpen = false;

  constructor(
    public authService: AuthenticationService,
    private router: Router,
    private dialog: MatDialog,
  ) {
    this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe(() => {
      this.isMenuOpen = false; //close menu on route change
    });
  }

  toggleMap() {
    this.router.navigate(['/map']);
  }

  openAddRestaurantModal() {
  if (!this.authService.isLoggedIn()) {
    this.router.navigate(['/login']);
    return;
  }

  this.dialog.open(AddRestaurantFormComponent, {
    width: '500px'
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

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
