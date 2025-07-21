import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from "../services/authentication.service";
import { inject } from "@angular/core";

export const canLogRegGuard: CanActivateFn = (route, state) => {
  return !inject(AuthenticationService).isLoggedIn()
    ? true
    : inject(Router).createUrlTree(["/"]);
};
