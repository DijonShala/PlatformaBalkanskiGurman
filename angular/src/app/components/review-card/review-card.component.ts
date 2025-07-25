import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Review } from '../../classes/review';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-review-card',
  imports: [CommonModule],
  templateUrl: './review-card.component.html',
  styleUrl: './review-card.component.scss',
})
export class ReviewCardComponent {
  @Input() review!: Review;
  @Output() deleteReview = new EventEmitter<number>();

  constructor(public authService: AuthenticationService) {}

  onDelete() {
    if (confirm('Are you sure you want to delete this review?')) {
      this.deleteReview.emit(this.review.id);
    }
  }
}
