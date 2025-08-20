import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Restaurant } from '../../classes/restaurant';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-restaurant-card',
  imports: [CommonModule, RouterLink],
  templateUrl: './restaurant-card.component.html',
  styleUrl: './restaurant-card.component.scss',
})
export class RestaurantCardComponent {
  @Input() restaurant!: Restaurant;

  CATEGORY_ICONS: Record<string, string> = {
    Cafe: 'cafe.png',
    'Casual Dining': 'casual-dining.png',
    'Fast Food': 'fast-food.png',
    'Fine Dining': 'fine-dining.png',
    'Food Truck': 'food-truck.png',
    Bakery: 'bakery.png',
    Bar: 'bar.png',
    Bistro: 'bistro.png',
    Buffet: 'buffet.png',
    Canteen: 'canteen.png',
    'Coffee Shop': 'coffee-shop.png',
    Deli: 'deli.png',
    'Drive-Thru': 'drive-thru.png',
    'Family Style': 'family-style.png',
    Gastropub: 'gastropub.png',
    'Pop-Up': 'pop-up.png',
    Pub: 'pub.png',
    'Quick Service': 'quick-service.png',
    Takeaway: 'takeaway.png',
    'Tea House': 'tea-house.png',
    Restaurant: 'restaurant.png',
  };

  getCategoryIcon(): string {
    const iconFile =
      this.CATEGORY_ICONS[this.restaurant.category] || 'restaurant.png';
    return `assets/${iconFile}`;
  }

  getRestaurantImage(): string {
    if (this.restaurant.photos && this.restaurant.photos.length > 0) {
      return this.restaurant.photos[0];
    }
    return this.getCategoryIcon();
  }

  formatRating(rating: any): string {
    const num = Number(rating);
    return !isNaN(num) ? num.toFixed(1) : 'N/A';
  }
}
