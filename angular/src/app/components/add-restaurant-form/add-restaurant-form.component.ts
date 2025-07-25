import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-add-restaurant-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './add-restaurant-form.component.html',
  styleUrls: ['./add-restaurant-form.component.scss'],
})
export class AddRestaurantFormComponent {
  restaurantForm: FormGroup;
  selectedFiles: File[] = [];

  CATEGORIES = [
  "Cafe", "Casual Dining", "Fast Food", "Fine Dining", "Food Truck", "Bakery",
  "Bar", "Bistro", "Buffet", "Canteen", "Coffee Shop", "Deli", "Drive-Thru",
  "Family Style", "Gastropub", "Pop-Up", "Pub", "Quick Service", "Takeaway", "Tea House", "Pizzeria", "Restaurant"
  ];

FOOD_TYPES = [
  "Slovenian", "Croatian", "Bosnian", "Serbian", "Montenegrin", "Macedonian", "Kosovar",
  "Balkan", "Yugoslav Fusion", "Bakery", "Barbecue", "Pizza", "Seafood", "Grill", "Mediterranean",
  "Middle Eastern", "Greek", "Turkish", "Italian", "Fusion", "Vegan", "Vegetarian", "Asian", "American",
  "French", "Chinese", "Indian", "Mexican"
];
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddRestaurantFormComponent>
  ) {
    this.restaurantForm = this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      foodType: [[], Validators.required],
      description: ['', Validators.required],
      postalCode: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
    });
  }


onFilesSelected(event: Event): void {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    this.selectedFiles = Array.from(target.files);
  }
}

  submit() {
  if (this.restaurantForm.valid) {
    const raw = this.restaurantForm.value;
      
    const formData = new FormData();

    formData.append('name', raw.name);
    formData.append('category', raw.category ?? '');
    formData.append('description', raw.description ?? '');
    formData.append('postalCode', raw.postalCode ?? '');
    formData.append('address', raw.address ?? '');
    formData.append('city', raw.city ?? '');
    formData.append('country', raw.country ?? '');

    raw.foodType.forEach((item: string) => {
      formData.append('foodType', item);
    });

    for (const file of this.selectedFiles) {
      formData.append('restaurant_photos', file);
    }

    this.dialogRef.close(formData);
  }
}

  cancel() {
    this.dialogRef.close(null);
  }
}
