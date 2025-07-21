import { Inject, Injectable } from '@angular/core';
import { BROWSER_STORAGE } from '../classes/storage';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../classes/user';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;
  constructor(
    private readonly http: HttpClient,
     @Inject(BROWSER_STORAGE) private readonly storage: Storage
    ) { }

  getAllUsers(page = 1, limit = 10): Observable<any> {
    const headers = new HttpHeaders()
    .set('Authorization', `Bearer ${this.storage.getItem('jwt-token')}`);
  return this.http.get(`${this.apiUrl}/users?page=${page}&limit=${limit}`, { headers });
  }

  getUserById(id: number): Observable<{data: User}> {
  const headers = new HttpHeaders()
  .set('Authorization', `Bearer ${this.storage.getItem('jwt-token')}`);

  return this.http.get<{ data:User }>(`${this.apiUrl}/user/${id}`, { headers });
  }

updateUser(id: number, data: any): Observable<any> {
   const headers = new HttpHeaders()
  .set('Authorization', `Bearer ${this.storage.getItem('jwt-token')}`);

  return this.http.put(`${this.apiUrl}/user/${id}`, data, { headers });
}

deleteUser(id: number): Observable<any> {
   const headers = new HttpHeaders()
  .set('Authorization', `Bearer ${this.storage.getItem('jwt-token')}`);
  return this.http.delete(`${this.apiUrl}/user/${id}`, { headers });
}

changePassword(id: number, data: { oldPassword: string; newPassword: string }): Observable<any> {
  const headers = new HttpHeaders()
    .set('Authorization', `Bearer ${this.storage.getItem('jwt-token')}`);

  return this.http.patch(`${this.apiUrl}/user/${id}/password`, data, { headers });
}
}
