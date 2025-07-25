import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RestaurantCommunicationService {
  private filtersChangedSource = new Subject<any>();
  private nearbySearchSource = new Subject<{
    lat: number;
    lng: number;
    maxDistance: number;
  }>();

  filtersChanged$ = this.filtersChangedSource.asObservable();
  nearbySearch$ = this.nearbySearchSource.asObservable();

  emitFiltersChanged(filters: any) {
    this.filtersChangedSource.next(filters);
  }

  emitNearbySearch(location: {
    lat: number;
    lng: number;
    maxDistance: number;
  }) {
    this.nearbySearchSource.next(location);
  }
}
