import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from '../../../services/restaurant.service';
import { AuthenticationService } from '../../../services/authentication.service';

@Component({
  selector: 'app-user-restaurant-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-restaurant-detail.component.html',
  styleUrls: ['./user-restaurant-detail.component.scss'],
})
export class UserRestaurantDetailComponent implements OnInit, OnChanges {
  @Input() restaurant: any;
  @Output() updated = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  error = '';
  internalRestaurant: any = null;
  selectedFiles: File[] = [];

  constructor(
    private fb: FormBuilder,
    private restaurantService: RestaurantService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthenticationService
  ) {}

  ngOnInit(): void {
    const idFromRoute = this.route.snapshot.paramMap.get('id');
    if (idFromRoute) {
      const restaurantId = +idFromRoute;
      this.loadRestaurant(restaurantId);
    } else if (this.restaurant) {
      this.initForm(this.restaurant);
    }
    }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['restaurant'] && this.restaurant) {
      this.initForm(this.restaurant);
    }
  }

  
  loadRestaurant(id: number): void {
    this.loading = true;
    this.restaurantService.getRestaurantById(id).subscribe({
      next: (res: any) => {
        this.internalRestaurant = res;
        this.initForm(res);
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load restaurant.';
        this.loading = false;
      },
    });
  }

  initForm(data: any): void {
    this.form = this.fb.group({
      name: [data.name || '', Validators.required],
      category: [data.category || ''],
      foodType: [data.foodType || ''],
      description: [data.description || ''],
      address: [data.address || '', Validators.required],
      postalCode: [data.postalCode || ''],
      city: [data.city || '', Validators.required],
      country: [data.country || '', Validators.required],
      photos: [data.photos || []],
    });
    this.error = '';
  }

  get currentRestaurantId(): number | null {
    if (this.restaurant?.id) return this.restaurant.id;
    if (this.internalRestaurant?.id) return this.internalRestaurant.id;
    return null;
  }

  updateRestaurant(): void {
    const restaurantId = this.currentRestaurantId;
    if (!restaurantId) {
      this.error = 'Restaurant ID not found.';
      return;
    }

    if (this.form.invalid) {
      this.error = 'Please fill out required fields.';
      return;
    }

    const formValues = this.form.value;
    const formData = new FormData();

    formData.append('name', formValues.name);
    formData.append('category', formValues.category || '');
    formData.append('foodType', formValues.foodType || '');
    formData.append('description', formValues.description || '');
    formData.append('address', formValues.address);
    formData.append('postalCode', formValues.postalCode || '');
    formData.append('city', formValues.city);
    formData.append('country', formValues.country);

    for (const file of this.selectedFiles) {
      formData.append('restaurant_photos', file);
    }

    this.loading = true;
    this.restaurantService.updateRestaurant(restaurantId, formData).subscribe({
      next: () => {
        alert('Restaurant updated successfully!');
        this.loading = false;
        this.updated.emit();
      },
      error: (err) => {
        this.error = err.error?.message || 'Update failed.';
        this.loading = false;
      },
    });
  }

  deleteRestaurant(): void {
    const restaurantId = this.currentRestaurantId;
    if (!restaurantId) {
      this.error = 'Restaurant ID not found.';
      return;
    }

    if (!confirm('Are you sure you want to delete this restaurant?')) return;

    this.loading = true;
    this.restaurantService.deleteRestaurant(restaurantId).subscribe({
      next: () => {
        alert('Restaurant deleted successfully!');
        this.loading = false;
        this.updated.emit();
        const currentUser = this.authService.getCurrentUser();
        if (currentUser?.role === 'admin') {
          this.router.navigate(['/admin/restaurants']);
        } else {
          this.router.navigate(['/dashboard/restaurants']);
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Delete failed.';
        this.loading = false;
      },
    });
  }

  clearAllPhotos(): void {
    this.form.get('photos')?.setValue([]);
    this.form.get('photos')?.markAsDirty();
    this.selectedFiles = [];
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
    }
  }
}
