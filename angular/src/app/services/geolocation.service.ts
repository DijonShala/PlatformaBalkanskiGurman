import { Injectable } from '@angular/core';

export interface Coordinates {
  lat: number;
  lng: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  constructor() { }

   getCurrentPosition(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          let message = '';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
            default:
              message = 'An unknown error occurred.';
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 
        }
      );
    });
  }
}
