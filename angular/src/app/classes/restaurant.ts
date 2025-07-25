export class Restaurant {
  id!: number;
  userId!: number;
  name!: string;
  category!: string;
  foodType?: string[];
  description?: string;
  location!: {
    type: 'Point';
    coordinates: [number, number];
  };
  address!: string;
  postalCode?: number;
  city!: string;
  country!: string;
  photos?: string[];
  rating!: number;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(init?: Partial<Restaurant>) {
    Object.assign(this, init);
    if (init?.rating != null) {
      this.rating = Number(init.rating);
    } else {
      this.rating = 0;
    }
  }
}

export interface CreateRestaurantPayload {
  id?: number;
  name: string;
  category?: string;
  foodType?: string[];
  description?: string;
  address?: string;
  postalCode?: number;
  city?: string;
  country?: string;
  photos?: string[];
}
