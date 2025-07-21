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

  constructor(
    private restaurantService: RestaurantService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.restaurantService.getRestaurants().subscribe({
      next: (res) => {
        this.restaurants = res.data || [];
        this.initMap();
      },
      error: (err) => {
        console.error('Failed to load restaurants:', err);
        this.initMap(); // fallback to show map
      },
    });
  }

  ngAfterViewInit(): void {
    // Map init happens after data load
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
        maximumAge: 0 
      }
    );
  }

  createMap(): void {
    const map = L.map(this.mapContainer.nativeElement).setView(this.userCoords, 13);

    // Add MapTiler tile layer
    L.tileLayer('https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=7Gdtuyj5Uo3n1L1mkXl9', {
      attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a>',
      tileSize: 512,
      zoomOffset: -1,
    }).addTo(map);

    // Add user marker
    L.marker(this.userCoords, { icon: this.createUserIcon() })
      .addTo(map)
      .bindPopup('You are here');

    // Add restaurant markers
    this.restaurants.forEach((r) => {
      if (r.latitude && r.longitude) {
        const marker = L.marker([r.latitude, r.longitude])
          .addTo(map)
          .bindPopup(
            `<strong>${r.name}</strong><br>${r.address}<br><a href="/restaurants/${r.id}">View Details</a>`
          );
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
