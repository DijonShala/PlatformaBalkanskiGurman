import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private filters: any = {};
  private page = 1;

  setFilters(filters: any) {
    this.filters = filters;
  }

  getFilters(): any {
    return this.filters;
  }

  clearFilters() {
    this.filters = {};
    this.page = 1;
  }

  setPage(page: number): void {
    this.page = page;
  }

  clearPage(): void {
    this.page = 1;
  }

  getPage(): number {
    return this.page;
  }
}
