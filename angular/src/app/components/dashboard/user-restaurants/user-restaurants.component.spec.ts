import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRestaurantsComponent } from './user-restaurants.component';

describe('UserRestaurantsComponent', () => {
  let component: UserRestaurantsComponent;
  let fixture: ComponentFixture<UserRestaurantsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRestaurantsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserRestaurantsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
