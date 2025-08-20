import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from '../../../services/restaurant.service';
import { AuthenticationService } from '../../../services/authentication.service';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-user-restaurant-detail',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatOptionModule,
    MatInputModule,
  ],
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
  alertMessage: string | null = null;
  alertType: string | null = null;

  CATEGORIES = [
    'Cafe',
    'Casual Dining',
    'Fast Food',
    'Fine Dining',
    'Food Truck',
    'Bakery',
    'Bar',
    'Bistro',
    'Buffet',
    'Canteen',
    'Coffee Shop',
    'Deli',
    'Drive-Thru',
    'Family Style',
    'Gastropub',
    'Pop-Up',
    'Pub',
    'Quick Service',
    'Takeaway',
    'Tea House',
    'Pizzeria',
    'Restaurant',
  ];

  FOOD_TYPES = [
    'Slovenian',
    'Croatian',
    'Bosnian',
    'Serbian',
    'Montenegrin',
    'Macedonian',
    'Kosovar',
    'Balkan',
    'Yugoslav Fusion',
    'Bakery',
    'Barbecue',
    'Pizza',
    'Seafood',
    'Grill',
    'Mediterranean',
    'Middle Eastern',
    'Greek',
    'Turkish',
    'Italian',
    'Fusion',
    'Vegan',
    'Vegetarian',
    'Asian',
    'American',
    'French',
    'Chinese',
    'Indian',
    'Mexican',
  ];

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
      name: [data.name || ''],
      category: [data.category || ''],
      foodType: [
        Array.isArray(data.foodType)
          ? data.foodType
          : (data.foodType || '').split(',').map((f: string) => f.trim()),
      ],
      description: [data.description || ''],
      address: [data.address || ''],
      postalCode: [data.postalCode || ''],
      city: [data.city || ''],
      country: [data.country || ''],
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
    const updatedData = this.getChangedFields(
      formValues,
      this.internalRestaurant
    );

    if (updatedData.keys().next().done) {
      // If no fields changed
      this.alertType = 'info';
      this.alertMessage = 'No changes to update.';
      return;
    }

    this.loading = true;
    this.restaurantService
      .updateRestaurant(restaurantId, updatedData)
      .subscribe({
        next: () => {
          this.alertType = 'success';
          this.alertMessage = 'Restaurant updated successfully';
          this.loading = false;
          this.updated.emit();
        },
        error: (err) => {
          this.alertType = 'error';
          this.alertMessage = err.error?.message || 'Restaurant update failed';
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
        this.alertType = 'success';
        this.alertMessage = 'Restaurant deleted succesfully';
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
        this.alertType = 'error';
        this.alertMessage = err.error?.message || 'Restaurant deletion error';
        this.loading = false;
      },
    });
  }

  private getChangedFields(formValues: any, original: any): FormData {
    const updatedData = new FormData();

    // Simple fields
    const simpleFields = [
      'name',
      'category',
      'description',
      'address',
      'postalCode',
      'city',
      'country',
    ];
    simpleFields.forEach((field) => {
      if (formValues[field] !== original[field]) {
        updatedData.append(field, formValues[field] || '');
      }
    });

    const originalFoodType = Array.isArray(original.foodType)
      ? original.foodType
      : (original.foodType || '').split(',').map((f: string) => f.trim());
    const newFoodType = Array.isArray(formValues.foodType)
      ? formValues.foodType
      : [];

    if (JSON.stringify(originalFoodType) !== JSON.stringify(newFoodType)) {
      newFoodType.forEach((food: string) =>
        updatedData.append('foodType', food)
      );
    }

    if (this.selectedFiles.length > 0) {
      this.selectedFiles.forEach((file) =>
        updatedData.append('restaurant_photos', file)
      );
    } else if (
      JSON.stringify(formValues.photos || []) !==
      JSON.stringify(original.photos || [])
    ) {
      (formValues.photos || []).forEach((url: string) =>
        updatedData.append('photos', url)
      );
    }

    return updatedData;
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
