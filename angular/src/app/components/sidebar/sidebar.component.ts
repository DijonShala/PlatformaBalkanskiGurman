import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeolocationService } from '../../services/geolocation.service';
import { RestaurantService } from '../../services/restaurant.service';
import { FilterService } from '../../services/filter.service';
import { RestaurantCommunicationService } from '../../services/restaurant-communication.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  categoryList: string[] = [];
  foodTypeList: string[] = [];
  cityList: string[] = [];
  countryList: string[] = [];

  searchName: string = '';
  selectedCategory = '';
  selectedFoodType = '';
  selectedCity = '';
  selectedCountry = '';
  error = '';
  loading = false;
  maxDistance: number = 5000;

  constructor(
    private restaurantService: RestaurantService,
    private filterService: FilterService,
    private commService: RestaurantCommunicationService,
    private geolocationService: GeolocationService
  ) {}

  ngOnInit(): void {
    this.loadCodelist('category');
    this.loadCodelist('foodType');
    this.loadCodelist('city');
    this.loadCodelist('country');

    const savedFilters = this.filterService.getFilters();
    if (savedFilters) {
      this.searchName = savedFilters.name || '';
      this.selectedCategory = savedFilters.category || '';
      this.selectedFoodType = savedFilters.foodType || '';
      this.selectedCity = savedFilters.city || '';
      this.selectedCountry = savedFilters.country || '';
      const hasValidFilters = Object.values(savedFilters).some(val => !!val && val !== 'nearby');

      if (hasValidFilters) {
        this.commService.emitFiltersChanged(savedFilters);
      } else {
        this.filterService.clearFilters();
      }
    }
  }

  loadCodelist(field: 'category' | 'foodType' | 'city' | 'country') {
    this.restaurantService.getCodelistValues(field).subscribe({
      next: (list) => {
        this[`${field}List`] = list;
      },
      error: (err) => {
        console.error(`Failed to load ${field} list`, err);
      }
    });
  }

  applyFilters(): void {
    const filters = {
      name: this.searchName,
      category: this.selectedCategory,
      foodType: this.selectedFoodType,
      city: this.selectedCity,
      country: this.selectedCountry
    };
    this.filterService.setFilters(filters);
    this.commService.emitFiltersChanged(filters);
  }

  clearFilters(): void {
    this.searchName = '';
    this.selectedCategory = '';
    this.selectedFoodType = '';
    this.selectedCity = '';
    this.selectedCountry = '';
    this.maxDistance = 5000;
    this.filterService.clearFilters();
    this.commService.emitFiltersChanged({});
  }

  askForLocationPermission(): void {
    const confirmed = confirm('This app would like to access your location to show nearby restaurants. Allow?');
    if (confirmed) {
      localStorage.setItem('locationPermission', 'granted');
      this.getUserLocationAndEmit();
    } else {
      localStorage.setItem('locationPermission', 'denied');
    }
  }

  onFindNearbyClick(): void {
    const permission = localStorage.getItem('locationPermission');
    if (permission === 'granted') {
      this.getUserLocationAndEmit();
    } else {
      this.askForLocationPermission();
    }
  }

  getUserLocationAndEmit(): void {
  this.geolocationService.getCurrentPosition()
    .then(({ lat, lng }) => {
      if (!this.maxDistance || this.maxDistance < 100) {
        this.maxDistance = 100;
      }
      this.commService.emitNearbySearch({
        lat,
        lng,
        maxDistance: this.maxDistance,
      });
    })
    .catch((err) => {
      this.error = err.message;
    });
  }
}
