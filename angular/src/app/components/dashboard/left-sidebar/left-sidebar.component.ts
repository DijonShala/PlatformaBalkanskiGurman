import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthenticationService } from '../../../services/authentication.service';
import { FilterService } from '../../../services/filter.service';

@Component({
  selector: 'app-left-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './left-sidebar.component.html',
  styleUrl: './left-sidebar.component.scss'
})
export class LeftSidebarComponent {
 constructor(
  private readonly authService: AuthenticationService,
  protected readonly filterService: FilterService
) {}

  get isAdmin(): boolean {
    return this.authService.getCurrentUser()?.role === 'admin';
  }

}
