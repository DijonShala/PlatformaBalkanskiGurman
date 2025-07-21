import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FilterService {

   private filters: any = {};

  setFilters(filters: any) {
    this.filters = filters;
  }

  getFilters(): any {
    return this.filters;
  }

  clearFilters() {
    this.filters = {};
  }
}
