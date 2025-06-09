import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { map, take } from 'rxjs/operators';
import { of } from 'rxjs';

export const ProfileSetupGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const userService = inject(UserService);
  const router = inject(Router);

  // Перевіряємо чи користувач авторизований
  if (!authService.isAuthenticated) {
    router.navigate(['/']);
    return false;
  }

  const cachedUser = authService.getCurrentUserCached();
  if (cachedUser) {
    if (!userService.isProfileSetupRequired(cachedUser)) {
      router.navigate(['/']);
      return false;
    }
    return true;
  }

  return userService.getCurrentUser().pipe(
    take(1),
    map(user => {
      authService.setCurrentUser(user);

      if (userService.isProfileSetupRequired(user)) {
        return true;
      } else {
        router.navigate(['/']);
        return false;
      }
    })
  );
};
