import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { Restaurant } from '../../classes/restaurant';
import { RestaurantCardComponent } from '../restaurant-card/restaurant-card.component';
import { RestaurantService } from '../../services/restaurant.service';
import { FilterService } from '../../services/filter.service';
import { RestaurantCommunicationService } from '../../services/restaurant-communication.service';

@Component({
  selector: 'app-restaurant-list',
  standalone: true,
  imports: [CommonModule, RestaurantCardComponent, RouterLink],
  templateUrl: './restaurant-list.component.html',
  styleUrls: ['./restaurant-list.component.scss']
})
export class RestaurantListComponent implements OnInit, OnDestroy {
  restaurants: Restaurant[] = [];
  loading = true;
  error = '';

  page = 1;
  limit = 10;
  totalPages = 1;

  fetchMode: 'all' | 'filter' | 'nearby' | 'search' = 'all';
  lastSearchName = '';
  lastFilters: any = {};
  lastCoords = { lat: 0, lng: 0 };
  lastMaxDistance = 5000;

  subscription!: Subscription;
  reloadSubscription!: Subscription;
  commSubscriptions: Subscription[] = [];

  constructor(
    private restaurantService: RestaurantService,
    private filterService: FilterService,
    private dialog: MatDialog,
    private commService: RestaurantCommunicationService
  ) {}

  ngOnInit(): void {
    this.subscription = this.restaurantService.currentRestaurants$.subscribe({
      next: (restaurants) => {
        this.restaurants = restaurants;
        this.loading = false;
        this.error = this.restaurants.length === 0 ? 'No restaurants found.' : '';
      },
      error: () => {
        this.error = 'Failed to load restaurants.';
        this.loading = false;
      }
    });

    this.reloadSubscription = this.restaurantService.reload$.subscribe(() => {
      this.loadRestaurants(this.page);
    });

    this.commSubscriptions.push(
      this.commService.filtersChanged$.subscribe(filters => {
        this.triggerFilter(filters);
      })
    );

    this.commSubscriptions.push(
      this.commService.nearbySearch$.subscribe(({ lat, lng, maxDistance }) => {
        this.triggerNearby(lat, lng, maxDistance);
      })
    );

    this.fetchInitialRestaurants();
  }

  fetchInitialRestaurants(): void {
    this.fetchMode = 'all';
    this.lastFilters = {};
    this.loadRestaurants(1);
  }

  loadRestaurants(page: number = 1): void {
    this.loading = true;
    this.error = '';
    this.page = page;

    let fetch$;

    switch (this.fetchMode) {
      case 'search':
        fetch$ = this.restaurantService.searchRestaurantsByName(this.lastSearchName, this.page, this.limit);
        break;

      case 'filter':
        if (!this.lastFilters || Object.keys(this.lastFilters).length === 0) {
          this.fetchMode = 'all';
          fetch$ = this.restaurantService.getRestaurants(this.page, this.limit);
        } else {
          fetch$ = this.restaurantService.filterRestaurants({
            ...this.lastFilters,
            page: this.page,
            limit: this.limit
          });
        }
        break;

      case 'nearby':
        fetch$ = this.restaurantService.getNearbyRestaurants(
          this.lastCoords.lat,
          this.lastCoords.lng,
          this.lastMaxDistance,
          this.page,
          this.limit
        );
        break;

      default:
        fetch$ = this.restaurantService.getRestaurants(this.page, this.limit);
        break;
    }

    fetch$.subscribe({
      next: (res) => {
        let rawData: any[] = [];

        if (Array.isArray(res)) {
          rawData = res;
          this.totalPages = 1;
        } else if (res?.data && Array.isArray(res.data)) {
          rawData = res.data;
          this.totalPages = res.totalPages || 1;
        } else {
          this.error = 'Unexpected response format.';
          this.loading = false;
          return;
        }

        this.restaurants = rawData.map((r: any) => new Restaurant(r));
        this.restaurantService.updateRestaurants(this.restaurants);
        this.loading = false;

        this.error = this.restaurants.length === 0 ? 'No restaurants found.' : '';
      },
      error: () => {
        this.error = 'Failed to load restaurants.';
        this.loading = false;
      }
    });
  }

  nextPage(): void {
    if (this.page < this.totalPages) this.loadRestaurants(this.page + 1);
  }

  prevPage(): void {
    if (this.page > 1) this.loadRestaurants(this.page - 1);
  }

  triggerSearch(name: string): void {
    this.fetchMode = 'search';
    this.lastSearchName = name;
    this.loadRestaurants(1);
  }

  triggerFilter(filters: any): void {
    const hasAnyFilter = Object.values(filters).some(value => !!value);
    this.fetchMode = hasAnyFilter ? 'filter' : 'all';
    this.lastFilters = filters;
    this.loadRestaurants(1);
  }

  triggerNearby(lat: number, lng: number, maxDistance: number): void {
    this.fetchMode = 'nearby';
    this.lastCoords = { lat, lng };
    this.lastMaxDistance = maxDistance;
    this.loadRestaurants(1);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.reloadSubscription?.unsubscribe();
    this.commSubscriptions.forEach(sub => sub.unsubscribe());
  }
}
