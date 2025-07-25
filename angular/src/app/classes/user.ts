export class User {
  id!: number;
  email!: string;
  firstname!: string;
  lastname!: string;
  username!: string;
  role!: string;
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(init?: Partial<User>) {
    Object.assign(this, init);
  }
}
