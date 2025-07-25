export class Pagination<T> {
  currentPage!: number;
  totalPages!: number;
  totalItems!: number;
  data!: T[];

  constructor(init?: Partial<Pagination<T>>) {
    Object.assign(this, init);
  }
}
