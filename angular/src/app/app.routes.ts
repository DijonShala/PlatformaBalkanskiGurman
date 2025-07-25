import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { RestaurantListComponent } from './components/restaurant-list/restaurant-list.component';
import { RestaurantDetailComponent } from './components/restaurant-detail/restaurant-detail.component';
import { AdminComponent } from './components/dashboard/admin/admin.component';
import { UserComponent } from './components/dashboard/user/user.component';
import { UserProfileComponent } from './components/dashboard/user-profile/user-profile.component';
import { ChangePasswordComponent } from './components/dashboard/change-password/change-password.component';
import { UserListComponent } from './components/dashboard/user-list/user-list.component';
import { UserRestaurantsComponent } from './components/dashboard/user-restaurants/user-restaurants.component';
import { UserRestaurantDetailComponent } from './components/dashboard/user-restaurant-detail/user-restaurant-detail.component';
import { canLogRegGuard } from './guards/canLogReg.guard';
import { authGuard } from './guards/auth-guard.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/restaurants', pathMatch: 'full' },

  /**
   * Public
   */
  { path: 'login', component: LoginComponent, canActivate: [canLogRegGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [canLogRegGuard] },

  {
    path: '',
    children: [
      { path: 'restaurants', component: RestaurantListComponent },
      { path: 'restaurants/:id', component: RestaurantDetailComponent }
    ]
  },

  /**
   * ADMIN only
   */
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'profile', component: UserProfileComponent },
      { path: 'change-password', component: ChangePasswordComponent },
      { path: 'users', component: UserListComponent },
      { path: 'users/:id', component: UserProfileComponent },
      { path: 'restaurants', component: UserRestaurantsComponent },
      { path: 'restaurants/:id', component: UserRestaurantDetailComponent }
    ]
  },

  /**
   * User loged in
   */
  {
    path: 'dashboard',
    component: UserComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'profile', component: UserProfileComponent },
      { path: 'change-password', component: ChangePasswordComponent },
      { path: 'restaurants', component: UserRestaurantsComponent },
      { path: 'restaurants/:id', component: UserRestaurantDetailComponent }
    ]
  },

  /**
   * Map
   */
  {
    path: 'map',
    loadComponent: () =>
      import('./components/map-page/map-page.component').then((m) => m.MapPageComponent)
  },

  { path: '**', redirectTo: '' }
];
