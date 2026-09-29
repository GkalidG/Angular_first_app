# Phase 4: Enterprise Routing, Forms, & Data Layer

In this phase, we will learn about advanced routing architecture (functional guards, route bindings), strictly typed reactive forms, and modern functional HTTP interceptors.

---

## Phase 4.1: Advanced Routing Architecture

Modern Angular features a streamlined, functional approach to routing.

### 1. Functional Route Guards

Legacy class-based guards (`CanActivate`, `CanDeactivate`) are deprecated. We now use pure functions:

- **`canActivateFn`**: Protects routes based on authentication/roles.
- **`canDeactivateFn`**: Warns users if they try to navigate away with unsaved form changes.
- **`canMatchFn`**: Decides whether a route matches based on conditions (great for loading different components for the same path).

```typescript
// auth.guard.ts (Functional Guard)
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login page
  return router.createUrlTree(['/login']);
};
```

---

### 2. Component Input Binding for Routes

Instead of injecting `ActivatedRoute` and subscribing to `params` or `queryParams`, you can bind path parameters directly to component inputs!

First, enable it in your routing configuration (`app.config.ts`):

```typescript
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

export const appConfig = {
  providers: [provideRouter(routes, withComponentInputBinding())],
};
```

Then, capture parameters directly as `input` signals in your component:

```typescript
// Path: /products/:id?category=electronics
@Component({...})
export class ProductDetailsComponent {
  // Binds automatically to route param ':id'
  id = input.required<string>();

  // Binds automatically to query param 'category'
  category = input<string>();
}
```

---

## Phase 4.2: Type-Safe Reactive Forms

Since Angular 14, Reactive Forms are strictly typed, eliminating the risk of runtime type errors when extracting form values.

### 1. Typed FormGroup and FormControl

TypeScript will now enforce the shape of your form fields.

```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

@Component({...})
export class CheckoutFormComponent {
  private fb = inject(FormBuilder);

  // FormGroup is strongly typed based on its controls
  checkoutForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    address: this.fb.group({
      street: ['', Validators.required],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]]
    })
  });

  onSubmit() {
    if (this.checkoutForm.valid) {
      // TypeScript knows that value is { email?: string; address?: { street?: string; zipCode?: string } }
      const value = this.checkoutForm.value;
      console.log(value.email);
    }
  }
}
```

---

### 2. Custom Async Validators (with RxJS `switchMap`)

Async validators are used to validate forms against an external source (like checking if an email is already registered on the database) without locking the UI.

```typescript
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, delay, map, of, switchMap } from 'rxjs';
import { UserService } from './user.service';

export function emailUniqueValidator(userService: UserService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) return of(null);

    return of(control.value).pipe(
      delay(500), // Debounce network requests
      switchMap((email) => userService.checkEmailExists(email)),
      map((exists) => (exists ? { emailExists: true } : null)),
    );
  };
}
```

---

## Phase 4.3: HTTP Client & Functional Interceptors

Functional interceptors process HTTP requests globally (e.g., adding headers, catching errors, redirecting on expired tokens) using pure functions.

### 1. Writing a Functional Interceptor

Instead of creating a class implementing `HttpInterceptor`, you write a `HttpInterceptorFn`:

```typescript
// jwt.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    // Clone request and inject JWT authorization header
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(authReq);
  }

  return next(req);
};
```

---

### 2. Providing the Interceptor

Register the functional interceptor inside `app.config.ts` using `withInterceptors`:

```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';

export const appConfig = {
  providers: [provideHttpClient(withInterceptors([jwtInterceptor]))],
};
```

---

**Next Steps:** Let me know if you have any questions on functional route guards, component input bindings, type-safe forms, or HTTP interceptors. When you are ready, we will proceed to **Phase 4.4 Practical Project: Routing & Checkout Flow**!
