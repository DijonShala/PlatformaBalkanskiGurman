import { TestBed } from '@angular/core/testing';

import { RestaurantCommunicationService } from './restaurant-communication.service';

describe('RestaurantCommunicationService', () => {
  let service: RestaurantCommunicationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RestaurantCommunicationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
