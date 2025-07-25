export class Review {
  id!: number;
  userId!: number;
  restaurantId!: number;
  rating!: number;
  comment?: string;
  photo?: string;
  createdAt?: Date;
  updatedAt?: Date;

  user?: {
    id: number;
    username: string;
  };

  constructor(init?: Partial<Review>) {
    Object.assign(this, init);
  }
}
