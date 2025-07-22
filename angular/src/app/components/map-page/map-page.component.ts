import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestaurantService } from '../../services/restaurant.service';
import { Router } from '@angular/router';
import * as L from 'leaflet';

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-page.component.html',
  styleUrls: ['./map-page.component.scss'],
})
export class MapPageComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  restaurants: any[] = [];
  userCoords: [number, number] = [44.82, 20.45]; // fallback coords
  map!: L.Map;
  restaurantMarkers: L.Marker[] = [];

  // Move CATEGORY_ICONS outside lifecycle hooks for access in methods
  CATEGORY_ICONS: Record<string, string> = {
    Cafe: 'assets/cafe.png',
    'Casual Dining': 'assets/casual-dining.png',
    'Fast Food': 'assets/fast-food.png',
    'Fine Dining': 'assets/fine-dining.png',
    'Food Truck': 'assets/food-truck.png',
    Bakery: 'assets/bakery.png',
    Bar: 'assets/bar.png',
    Bistro: 'assets/bistro.png',
    Buffet: 'assets/buffet.png',
    Canteen: 'assets/canteen.png',
    'Coffee Shop': 'assets/coffee-shop.png',
    Deli: 'assets/deli.png',
    'Drive-Thru': 'assets/drive-thru.png',
    'Family Style': 'assets/family-style.png',
    Gastropub: 'assets/gastropub.png',
    'Pop-Up': 'assets/pop-up.png',
    Pub: 'assets/pub.png',
    'Quick Service': 'assets/quick-service.png',
    Takeaway: 'assets/takeaway.png',
    'Tea House': 'assets/tea-house.png',
    Restaurant: 'assets/restaurant.png'
  };

  constructor(
    private restaurantService: RestaurantService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initMap();
  }

  ngAfterViewInit(): void {
    const DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    L.Marker.prototype.options.icon = DefaultIcon;
  }

  createCategoryIcon(category: string): L.Icon {
    const iconUrl = this.CATEGORY_ICONS[category] || 'assets/restuarant.png'; // fallback icon

    return L.icon({
      iconUrl,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30],
    });
  }

  initMap(): void {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.userCoords = [pos.coords.latitude, pos.coords.longitude];
        this.createMap();
      },
      () => {
        this.createMap();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  createMap(): void {
    this.map = L.map(this.mapContainer.nativeElement).setView(this.userCoords, 13);

    L.tileLayer(
      'https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=7Gdtuyj5Uo3n1L1mkXl9',
      {
        attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a>',
        tileSize: 512,
        zoomOffset: -1,
      }
    ).addTo(this.map);

    // Add user marker
    L.marker(this.userCoords, { icon: this.createUserIcon() })
      .addTo(this.map)
      .bindPopup('You are here');

    // Load initial bounds
    this.loadRestaurantsInView();

    // Reload restaurants on pan/zoom
    this.map.on('moveend', () => this.loadRestaurantsInView());
  }

  loadRestaurantsInView(): void {
    const bounds = this.map.getBounds();
    const minLat = bounds.getSouth();
    const minLng = bounds.getWest();
    const maxLat = bounds.getNorth();
    const maxLng = bounds.getEast();

    this.restaurantService
      .getRestaurantsInBounds(minLat, minLng, maxLat, maxLng)
      .subscribe({
        next: (res) => {
          this.restaurants = res.data || [];
          this.renderRestaurantMarkers();
        },
        error: (err) => {
          console.error('Failed to load restaurants in bounds:', err);
        },
      });
  }

  renderRestaurantMarkers(): void {
    // Clear old markers
    this.restaurantMarkers.forEach((marker) => this.map.removeLayer(marker));
    this.restaurantMarkers = [];

    this.restaurants.forEach((r) => {
      if (r.location?.coordinates?.length === 2) {
        const [longitude, latitude] = r.location.coordinates;
        const addressText = r.address ? r.address : '';
        const ratingNum = Number(r.rating);
        const ratingText = !isNaN(ratingNum) ? `Rating: ★ ${ratingNum.toFixed(1)}` : '';

        const popupContent = `
        <strong>${r.name}</strong><br>
        ${addressText}<br>
        ${ratingText ? ratingText + '<br>' : ''}
        <a href="/restaurants/${r.id}">View Details</a>
        `;
        const marker = L.marker([latitude, longitude], {
          icon: this.createCategoryIcon(r.category),
        })
          .addTo(this.map)
          .bindPopup(
            popupContent
          );

        this.restaurantMarkers.push(marker);
      }
    });
  }

  createUserIcon(): L.Icon {
    return L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30],
    });
  }
}
