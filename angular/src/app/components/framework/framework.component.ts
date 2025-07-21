import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { RouterOutlet, RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { RestaurantListComponent } from '../restaurant-list/restaurant-list.component';
import { filter } from 'rxjs/operators';
import { FilterService } from '../../services/filter.service';
import { RestaurantCommunicationService } from '../../services/restaurant-communication.service';

@Component({
  selector: 'app-framework',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    RestaurantListComponent
  ],
  templateUrl: './framework.component.html',
  styleUrls: ['./framework.component.scss']
})
export class FrameworkComponent implements AfterViewInit {
  @ViewChild(RestaurantListComponent) restaurantList!: RestaurantListComponent;

  showMap = false;
  showSidebar = true;
  error: string = '';

  constructor(
    private router: Router,
    private filterService: FilterService,
    private commService: RestaurantCommunicationService
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const showSidebarOnlyOn = ['/', '/restaurants'];
        this.showSidebar = showSidebarOnlyOn.includes(event.urlAfterRedirects);
      });
  }

  ngAfterViewInit(): void {
    const savedFilters = this.filterService.getFilters();

    const hasValidFilters =
      savedFilters &&
      Object.values(savedFilters).some(val => !!val && val !== 'nearby');

    if (hasValidFilters && this.restaurantList) {
      this.restaurantList.triggerFilter(savedFilters);
    } else if (this.restaurantList) {
      // No saved filters – load all
      this.restaurantList.fetchMode = 'all';
      this.restaurantList.loadRestaurants(1);
    }
    this.commService.filtersChanged$.subscribe(filters => {
    this.filterService.setFilters(filters);
  });

  this.commService.nearbySearch$.subscribe(location => {
    this.filterService.setFilters({
      latitude: location.lat,
      longitude: location.lng,
      maxDistance: location.maxDistance
    });
  });

  }

  toggleMap() {
    this.showMap = !this.showMap;
  }

  onFiltersChanged(filters: any) {
    const hasAnyFilter = Object.values(filters).some(value => !!value);

    if (hasAnyFilter) {
      this.filterService.setFilters(filters);
      this.restaurantList?.triggerFilter(filters);
    } else {
      this.filterService.clearFilters();
      this.restaurantList.fetchMode = 'all';
      this.restaurantList.loadRestaurants(1);
    }
  }

  onFindNearby(locationData: { lat: number; lng: number; maxDistance: number }) {
    const filters = {
      latitude: locationData.lat,
      longitude: locationData.lng,
      maxDistance: locationData.maxDistance
    };

    this.filterService.setFilters(filters);

    if (this.restaurantList) {
      this.restaurantList.triggerNearby(
        locationData.lat,
        locationData.lng,
        locationData.maxDistance
      );
    } else {
      console.warn('RestaurantList component not yet initialized');
    }
  }
}
