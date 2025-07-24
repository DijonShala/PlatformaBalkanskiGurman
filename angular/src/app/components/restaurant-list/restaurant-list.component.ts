import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, NavigationStart } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Restaurant } from '../../classes/restaurant';
import { RestaurantCardComponent } from '../restaurant-card/restaurant-card.component';
import { RestaurantService } from '../../services/restaurant.service';
import { FilterService } from '../../services/filter.service';
import { RestaurantCommunicationService } from '../../services/restaurant-communication.service';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatPaginatorModule} from '@angular/material/paginator';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-restaurant-list',
  standalone: true,
  imports: [CommonModule, RestaurantCardComponent, RouterLink, MatProgressSpinnerModule, MatPaginatorModule],
  templateUrl: './restaurant-list.component.html',
  styleUrls: ['./restaurant-list.component.scss']
})
export class RestaurantListComponent implements OnInit, OnDestroy {
  restaurants: Restaurant[] = [];
  loading = true;
  error = '';

  totalItems = 0;
  limit = 10;
  page = 1;
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
    protected filterService: FilterService,
    private dialog: MatDialog,
    private commService: RestaurantCommunicationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load page from filterService (default to 1 if none)
    this.page = this.filterService.getPage() || 1;
    
    this.router.events
    .pipe(filter(event => event instanceof NavigationStart))
    .subscribe(() => {
      this.filterService.setPage(this.page);
    });
    // Load filters from filterService (if any)
    const savedFilters = this.filterService.getFilters();
    if (savedFilters && Object.values(savedFilters).some(val => !!val)) {
      this.lastFilters = savedFilters;
      this.fetchMode = 'filter';
    } else {
      this.fetchMode = 'all';
    }

    this.loadRestaurants(this.page);

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
  }

  loadRestaurants(page: number = 1): void {
    this.loading = true;
    this.error = '';
    this.page = page;

    // Store page in filterService
    this.filterService.setPage(page);

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

    if (res?.data && Array.isArray(res.data)) {
      rawData = res.data;
      this.totalPages = res.totalPages || 1;
      this.totalItems = res.totalItems || 0;
      this.page = res.currentPage || this.page;
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
  
  onPageChange(event: PageEvent): void {
  this.limit = event.pageSize;
  this.page = event.pageIndex + 1;

  this.filterService.setPage(this.page);
  this.loadRestaurants(this.page);
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
    this.filterService.setFilters(filters);
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
