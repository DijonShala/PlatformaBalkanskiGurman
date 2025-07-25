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
import { LayoutComponent } from './components/layout/layout.component'; // Renamed from FrameworkComponent

export const routes: Routes = [
  { path: '', redirectTo: '/restaurants', pathMatch: 'full' },

  // Public routes
  { path: 'login', component: LoginComponent, canActivate: [canLogRegGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [canLogRegGuard] },

  // Layout wrapper for routes with shared UI
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'restaurants', component: RestaurantListComponent },
      { path: 'restaurants/:id', component: RestaurantDetailComponent }
    ]
  },

  // Admin dashboard
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

  // Authenticated user dashboard
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

  // Lazy-loaded map route
  {
    path: 'map',
    loadComponent: () =>
      import('./components/map-page/map-page.component').then((m) => m.MapPageComponent)
  },

  // Catch-all redirect
  { path: '**', redirectTo: '' }
];
