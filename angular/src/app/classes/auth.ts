export class AuthResponse {
  token!: string;
  user!: {
    id: number;
    firstname: string;
    username: string;
    role: string;
  };

  constructor(init?: Partial<AuthResponse>) {
    Object.assign(this, init);
  }
}