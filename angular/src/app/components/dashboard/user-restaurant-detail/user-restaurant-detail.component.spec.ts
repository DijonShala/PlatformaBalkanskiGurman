import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRestaurantDetailComponent } from './user-restaurant-detail.component';

describe('UserRestaurantDetailComponent', () => {
  let component: UserRestaurantDetailComponent;
  let fixture: ComponentFixture<UserRestaurantDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRestaurantDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserRestaurantDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
