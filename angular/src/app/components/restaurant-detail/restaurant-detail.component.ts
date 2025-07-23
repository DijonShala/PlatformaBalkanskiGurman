import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Restaurant } from '../../classes/restaurant';
import { Review } from '../../classes/review';
import { RestaurantService } from '../../services/restaurant.service';
import { AuthenticationService } from '../../services/authentication.service';
import { ReviewCardComponent } from '../review-card/review-card.component';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule, ReviewCardComponent, FormsModule],
  templateUrl: './restaurant-detail.component.html',
  styleUrls: ['./restaurant-detail.component.scss']
})
export class RestaurantDetailComponent implements OnInit {
  restaurant!: Restaurant;
  reviews: Review[] = [];
  loading = true;
  error = '';
  newReviewComment: string = '';
  newReviewRating: number = 5;
  selectedPhoto: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private restaurantService: RestaurantService,
    public authenticationService: AuthenticationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.loadRestaurant(id);
    this.loadReviews(id);
  }

  isLoggedIn(): boolean {
  return this.authenticationService.isLoggedIn();
  }


  loadRestaurant(id: number): void {
    this.restaurantService.getRestaurantById(id).subscribe({
      next: (res) => {
        this.restaurant = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Could not load restaurant details.';
        console.error(err);
        this.loading = false;
      }
    });
  }

  loadReviews(id: number): void {
    this.restaurantService.getReviewsByRestaurantId(id).subscribe({
      next: (res) => (this.reviews = res),
      error: (err) => console.error('Failed to load reviews', err)
    });
  }

  onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    this.selectedPhoto = input.files[0];
  }
  }

  submitReview(): void {
  if (!this.newReviewComment.trim()) {
    alert('Comment is required.');
    return;
  }

  const formData = new FormData();
  formData.append('rating', this.newReviewRating.toString());
  formData.append('comment', this.newReviewComment.trim());

  if (this.selectedPhoto) {
    formData.append('review_photo', this.selectedPhoto);
  }

  this.restaurantService.postReview(this.restaurant.id, formData).subscribe({
    next: (res) => {
      this.reviews.unshift(res);
      this.newReviewComment = '';
      this.newReviewRating = 5;
      this.selectedPhoto = null;

      this.loadRestaurant(this.restaurant.id);
    },
    error: (err) => {
      console.error('Failed to submit review', err);
      alert('Failed to submit review');
    }
  });
}


deleteReview(reviewId: number): void {
  this.restaurantService.deleteReview(reviewId, this.restaurant.id).subscribe({
    next: () => {
      this.reviews = this.reviews.filter(r => r.id !== reviewId);
      this.loadRestaurant(this.restaurant.id); // refresh rating
    },
    error: (err) => {
      console.error('Failed to delete review', err);
      alert('Could not delete the review.');
    }
  });
}

}
