import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add-restaurant-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-restaurant-form.component.html',
  styleUrls: ['./add-restaurant-form.component.scss'],
})
export class AddRestaurantFormComponent {
  restaurantForm: FormGroup;
  selectedFiles: File[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddRestaurantFormComponent>
  ) {
    this.restaurantForm = this.fb.group({
      name: ['', Validators.required],
      category: [''],
      foodType: [''],
      description: [''],
      postalCode: [''],
      address: [''],
      city: [''],
      country: [''],
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

    // Append all fields to FormData
    formData.append('name', raw.name);
    formData.append('category', raw.category ?? '');
    formData.append('foodType', raw.foodType ?? '');
    formData.append('description', raw.description ?? '');
    formData.append('postalCode', raw.postalCode ?? '');
    formData.append('address', raw.address ?? '');
    formData.append('city', raw.city ?? '');
    formData.append('country', raw.country ?? '');

    // Append selected image files
    for (const file of this.selectedFiles) {
      formData.append('restaurant_photos', file);
    }

    this.dialogRef.close(formData);  // send to service
  }
}

  cancel() {
    this.dialogRef.close(null);
  }
}
