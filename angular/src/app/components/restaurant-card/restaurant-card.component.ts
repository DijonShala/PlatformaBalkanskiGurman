import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Restaurant } from '../../classes/restaurant';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-restaurant-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './restaurant-card.component.html',
  styleUrl: './restaurant-card.component.scss'
})
export class RestaurantCardComponent {
   @Input() restaurant!: Restaurant;

  formatRating(rating: any): string {
  const num = Number(rating);
  return !isNaN(num) ? num.toFixed(1) : 'N/A';
}
}
