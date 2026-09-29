# Phase 3.1: Signal Primitives

Angular Signals provide fine-grained reactivity. Unlike Zone.js which intercepts browser events and checks the entire component tree for changes, Signals explicitly track what state has changed and precisely notify the components that depend on it.

There are three primary Signal primitives:

## 1. Writable Signals (`signal`)

A writable signal is a reactive value container that you can update directly.

```typescript
import { signal } from '@angular/core';

// 1. Creation: Initialize with a default value
const count = signal<number>(0);

// 2. Reading: Call the signal like a function
console.log(count()); // Output: 0

// 3. Modifying (Option A): Set a direct value
count.set(5);

// 4. Modifying (Option B): Update based on the current value
count.update((current) => current + 1);
```

> [!WARNING]
> Do NOT use `mutate` on signals (it was deprecated and removed). Always use `set` or `update`. For objects or arrays, return a new reference:
>
> ```typescript
> const items = signal<string[]>(['Apple']);
> items.update((current) => [...current, 'Banana']);
> ```

---

## 2. Computed Signals (`computed`)

A computed signal derives its value from other signals. It is **read-only** and **lazily evaluated** (it only computes when read, and memoizes the result until the dependency signals change).

```typescript
import { signal, computed } from '@angular/core';

const price = signal(100);
const quantity = signal(2);

// Derived state
const total = computed(() => price() * quantity());

console.log(total()); // Output: 200

// If quantity changes, total automatically recalculates on next read
quantity.set(3);
console.log(total()); // Output: 300
```

# 3. Linked Signal (`linkedSignal`)

Introduced in Angular 19, the linkedSignal essentially functions as a writable computed signal. It combines the reactive dependency tracking of a computed() signal with the manual mutability of a standard signal():

This solves a common problem: having a local state (like a selected quantity or input text) that needs to reset back to a default value when a parent selection (like a selected product) changes.

Core Use Case ExampleThe primary use case is resetting local UI state when a primary state changes (e.g., selecting a new item from a list and needing the detail view's form or quantity counter to reset to a default value).

```ts
import { signal, linkedSignal } from '@angular/core';

// 1. The Source Signal
const selectedProduct = signal({ id: 1, name: 'Laptop', defaultQty: 1 });

// 2. The Linked Signal (Combines reactive source + local manual updates)
const quantity = linkedSignal({
  source: selectedProduct,
  computation: (product) => product.defaultQty,
});

console.log(quantity()); // Output: 1 (derived from source)

// Overwrite manually (Writable behavior)
quantity.set(5);
console.log(quantity()); // Output: 5

// Change the source signal (Computed behavior)
selectedProduct.set({ id: 2, name: 'Phone', defaultQty: 2 });
console.log(quantity()); // Output: 2 (Automatically reset by the source update!)
```

## The Shorthand SyntaxYou:

simply write an arrow function that reads from a source signal. Any signal read inside this function automatically becomes a tracked dependency.

```ts
import { signal, linkedSignal } from '@angular/core';

const product = signal({ name: 'Laptop', price: 1000 });

// Shorthand: Looks exactly like computed()
const promoPrice = linkedSignal(() => product().price * 0.9);

// It recalculates automatically if product changes, but you can still override it:
promoPrice.set(850);
```

## When to Use Which

- Use the Shorthand Syntax: For simple dependencies and quick state resets (e.g., picking the first item from a dynamic list, simple arithmetic, or basic string mapping).
- Use the Full Syntax: If you need to access the previous value of the linked signal to determine its new state, or if you want to track an object configuration or multiple combined sources.

---

## 4. Effects (`effect`)

An effect is an operation that runs whenever one or more signal dependencies change. Use effects **only** for side-effects:

- Logging / analytics tracking.
- Custom DOM manipulations (Canvas drawing, third-party libraries).
- Syncing state to `localStorage`.

```typescript
import { signal, effect } from '@angular/core';

const query = signal('');

effect(() => {
  // Automatically runs every time `query` changes
  console.log(`Searching database for: ${query()}`);
});
```

> [!CAUTION]
> Avoid updating signals inside an effect unless strictly necessary. Doing so can cause infinite change detection loops. By default, setting a signal in an effect is prohibited unless you explicitly enable `allowSignalWrites: true` in the effect options.

---

# Phase 3.2: Signal & RxJS Interoperability

While Signals excel at managing synchronous, local UI state, **RxJS is still essential** for asynchronous operations, events, time-based operators (like `debounceTime`, `switchMap`), and WebSockets.

Angular provides the `@angular/core/rxjs-interop` package to bridge the two worlds.

## 1. Converting Observable to Signal (`toSignal`)

Use `toSignal()` to subscribe to an Observable and expose its values as a Signal. This is ideal for binding API responses directly to template code.

```typescript
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  template: `
    @if (products()) {
      <ul>
        @for (p of products(); track p.id) {
          <li>{{ p.name }}</li>
        }
      </ul>
    }
  `,
})
export class ProductListComponent {
  private http = inject(HttpClient);

  // Converts Observable to Signal.
  // Note: We provide requireSync: true if the observable emits immediately,
  // or initialValue to avoid the signal returning `undefined` initially.
  products = toSignal(this.http.get<Product[]>('/api/products'), { initialValue: [] });
}
```

## 2. Converting Signal to Observable (`toObservable`)

If you want to use RxJS operators (like `debounceTime` for a search input) on a Signal's changes, convert the Signal to an Observable.

```typescript
import { Component, signal, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ProductService } from './product.service';

@Component({...})
export class SearchProductsComponent {
  private productService = inject(ProductService);

  searchTerm = signal('');

  // 1. Convert search signal to Observable
  // 2. Use RxJS operators to debounce inputs
  // 3. SwitchMap to HTTP requests
  // 4. Convert back to Signal for easy template usage
  searchResults = toSignal(
    toObservable(this.searchTerm).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.productService.search(term))
    ),
    { initialValue: [] }
  );
}
```

## 3. Asynchronous Resource Handling (`rxResource`)

Angular v19 introduced the experimental `resource` and `rxResource` APIs to handle asynchronous data fetching purely within the Signal ecosystem without needing `toSignal(toObservable(...))` chains.

```typescript
import { Component, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  template: `
    @if (userResource.isLoading()) {
      <p>Loading...</p>
    } @else if (userResource.value(); as user) {
      <p>User Email: {{ user.email }}</p>
    }
  `,
})
export class UserProfileComponent {
  private http = inject(HttpClient);
  userId = signal('user_123');

  // rxResource automatically re-fetches when `userId` changes!
  userResource = rxResource({
    params: () => ({ id: this.userId() }),
    stream: ({ request }) => this.http.get<User>(`/api/users/${request.id}`),
    defaultValue: {},
  });
}
```

---

**Next Steps:** Let me know if you have any questions about how Signals track dependencies, or how `toSignal` and `toObservable` bridge the gap. If you're ready, we will proceed to **Phase 3.3 Practical Project: Reactive Shopping Cart**!
