import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Restaurant, CreateRestaurantPayload } from '../classes/restaurant';
import { Review } from '../classes/review';
import { map, Observable, BehaviorSubject, Subject } from 'rxjs';
import { BROWSER_STORAGE } from '../classes/storage';
import { Pagination } from '../classes/pagination';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RestaurantService {
  private apiUrl = environment.apiUrl;

  private reloadTrigger$ = new Subject<void>();

  private restaurantsSubject = new BehaviorSubject<Restaurant[]>([]);
  currentRestaurants$ = this.restaurantsSubject.asObservable();

  constructor(
    private http: HttpClient,
     @Inject(BROWSER_STORAGE) private storage: Storage
  ) {}

  get reload$() {
  return this.reloadTrigger$.asObservable();
  }

  triggerReload() {
  this.reloadTrigger$.next();
  }
  
  getRestaurants(page = 1, limit = 10): Observable<Pagination<Restaurant>> {
  const params = new HttpParams()
    .set('page', page.toString())
    .set('limit', limit.toString());

  return this.http
    .get<Pagination<Restaurant>>(`${this.apiUrl}/restaurants`, { params })
    .pipe(
      map(res => new Pagination<Restaurant>({
        currentPage: res.currentPage,
        totalPages: res.totalPages,
        totalItems: res.totalItems,
        data: res.data.map(r => new Restaurant(r))
      }))
    );
  }

  getRestaurantById(id: number): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.apiUrl}/restaurants/${id}`)
    .pipe(map(r => new Restaurant(r)));
  }

  getReviewsByRestaurantId(id: number): Observable<Review[]> {
  return this.http
    .get<{ data: Review[] }>(`${this.apiUrl}/restaurants/${id}/reviews`)
    .pipe(map(res => res.data));
}

getCodelistValues(field: 'category' | 'foodType' | 'city' | 'country'): Observable<string[]> {
  return this.http
    .get<{ status: string; data: string[] }>(`${this.apiUrl}/restaurants/codelist/${field}`)
    .pipe(map(res => res.data));
}

searchRestaurantsByName(name: string, page = 1, limit = 10): Observable<Pagination<Restaurant>> {
  const params = { name, page, limit };

  return this.http
    .get<Pagination<Restaurant>>(`${this.apiUrl}/restaurants/search`, { params })
    .pipe(
      map(res => new Pagination<Restaurant>({
        currentPage: res.currentPage,
        totalPages: res.totalPages,
        totalItems: res.totalItems,
        data: res.data.map(r => new Restaurant(r))
      }))
    );
}

getRestaurantsInBounds(minLat: number, minLng: number, maxLat: number, maxLng: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/restaurants/in-bounds`, {
    params: {
      minLat,
      minLng,
      maxLat,
      maxLng,
    }
  });
}

filterRestaurants(filters: {
  category?: string;
  foodType?: string;
  city?: string;
  country?: string;
  name?: string;
  page?: number;
  limit?: number;
}): Observable<Pagination<Restaurant>> {
  return this.http
    .get<Pagination<Restaurant>>(`${this.apiUrl}/restaurants/filter`, { params: filters })
    .pipe(
      map(res => new Pagination<Restaurant>({
        currentPage: res.currentPage,
        totalPages: res.totalPages,
        totalItems: res.totalItems,
        data: res.data.map(r => new Restaurant(r))
      }))
    );
}

updateRestaurants(restaurants: Restaurant[]) {
    this.restaurantsSubject.next(restaurants);
}

public createRestaurant(formData: FormData): Observable<Restaurant> {
  const url = `${this.apiUrl}/restaurants`;

  const headers = new HttpHeaders()
    .set('Authorization', `Bearer ${this.storage.getItem('jwt-token')}`);

  return this.http.post<Restaurant>(url, formData, { headers });
}

getNearbyRestaurants(
  lat: number,
  lng: number,
  maxDistance: number = 5000,
  page: number = 1,
  limit: number = 10
): Observable<Pagination<Restaurant>> {
  const params = new HttpParams()
    .set('lat', lat.toString())
    .set('lng', lng.toString())
    .set('maxDistance', maxDistance.toString())
    .set('page', page.toString())
    .set('limit', limit.toString());

  return this.http
    .get<Pagination<Restaurant>>(`${this.apiUrl}/restaurants/distance`, { params })
    .pipe(
      map(res => new Pagination<Restaurant>({
        currentPage: res.currentPage,
        totalPages: res.totalPages,
        totalItems: res.totalItems,
        data: res.data.map(r => new Restaurant(r))
      }))
    );
}


postReview(
  restaurantId: number,
  data: FormData,
): Observable<Review> {
  const url = `${this.apiUrl}/restaurants/${restaurantId}/reviews`;
  const headers = new HttpHeaders()
    .set('Authorization', `Bearer ${this.storage.getItem('jwt-token')}`);

  return this.http.post<{ data: Review }>(url, data, { headers }).pipe(
    map(res => new Review(res.data))
  );
}

deleteReview(reviewId: number, restaurantId: number): Observable<any> {
  const token = this.storage.getItem('jwt-token');
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  return this.http.delete(
    `${this.apiUrl}/restaurants/${restaurantId}/reviews/${reviewId}`,
    { headers }
  );
  }

  getRestaurantsByUserId(userId: number, page: number = 1, limit: number = 10): Observable<Pagination<Restaurant>> {
    const token = this.storage.getItem('jwt-token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<Pagination<Restaurant>>(
      `${this.apiUrl}/restaurants/user/${userId}`, { headers, params }
    ).pipe(
      map(res => new Pagination<Restaurant>({
        currentPage: res.currentPage,
        totalPages: res.totalPages,
        totalItems: res.totalItems,
        data: res.data.map(r => new Restaurant(r))
      }))
    );
  }

  updateRestaurant(id: number, data: FormData): Observable<any> {
  const token = this.storage.getItem('jwt-token');
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  return this.http.put(`${this.apiUrl}/restaurants/${id}`, data, { headers });
}

  deleteRestaurant(id: number) {
     const token = this.storage.getItem('jwt-token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  return this.http.delete(`${this.apiUrl}/restaurants/${id}`, { headers });
}
}
