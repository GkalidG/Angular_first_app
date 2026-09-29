### Here is a complete, production-ready example of an Angular service. It uses `HttpClient` to fetch data, applies a pipeline of RxJS operators to transform and protect the stream, and exposes the clean data as an Observable for components to consume.

### The Service File (`products.service.ts`)

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, retry, throwError } from 'rxjs';

// Define the exact shape of your raw API data
interface ApiProduct {
  id: number;
  title: string;
  price: number;
  category: string;
  is_active: boolean;
}

// Define the clean shape your frontend components actually want
export interface Product {
  id: number;
  name: string;
  price: number;
}

@Injectable({
  providedIn: 'root', // Makes this service a global singleton available anywhere
})
export class ProductsService {
  // Inject the Angular HttpClient using the modern 'inject' function
  private http = inject(HttpClient);
  private apiUrl = 'https://api.example.com/products';

  /**
   * Fetches, filters, transforms, and safeguards product data.
   * Returns a clean Observable stream of Products.
   */
  getProducts(): Observable<Product[]> {
    return this.http.get<ApiProduct[]>(this.apiUrl).pipe(
      // 1. Retry the network request up to 2 times if it fails initially
      retry(2),

      // 2. Transform the raw backend data structure into what the frontend needs
      map((rawProducts: ApiProduct[]) => {
        return rawProducts
          .filter((p) => p.is_active) // Keep only active items
          .map((p) => ({
            id: p.id,
            name: p.title, // Remap 'title' to 'name'
            price: p.price,
          }));
      }),

      // 3. Intercept and handle any server or network errors gracefully
      catchError((error) => {
        console.error('Products fetch failed:', error);
        // Return a user-friendly error message down the stream
        return throwError(() => new Error('Unable to load products. Please try again later.'));
      }),
    );
  }
}
```

---

### How to Consume This in a Component (Best Practice)

Instead of subscribing manually in your component code, use the **`async` pipe** in your template. This tells Angular to manage the subscription lifecycle for you, automatically preventing memory leaks.

#### The TypeScript Component (`product-list.component.ts`)

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsService } from './products.service';
import { Observable, catchError, of } from 'rxjs';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-list.component.html',
})
export class ProductListComponent {
  private productsService = inject(ProductsService);

  // Expose the stream directly to the template
  products$ = this.productsService.getProducts().pipe(
    catchError((err) => {
      this.errorMessage = err.message;
      return of([]); // Return an empty array stream so the UI doesn't crash
    }),
  );

  errorMessage: string | null = null;
}
```

#### The HTML Template (`product-list.component.html`)

```html
<h2>Available Products</h2>

@if (errorMessage) {
<div class="error">{{ errorMessage }}</div>
}

<!-- The 'async' pipe subscribes to products$ automatically here -->
@if (products$ | async; as products) {
<ul>
  @for (product of products; track product.id) {
  <li>{{ product.name }} - ${{ product.price }}</li>
  } @empty {
  <li>No products available.</li>
  }
</ul>
} @else if (!errorMessage) {
<p>Loading products...</p>
}
```

### Key Highlights of this Architecture

1. **`providedIn: 'root'`**: Eliminates the need to declare the service in an Angular Module array. It lazy-loads automatically when needed.
2. **`pipe()` Pipeline**: Keeps your transformations modular. The component receives pure, clean data (`Product[]`) and remains entirely unaware of the messy API format (`ApiProduct[]`) or the `retry` logic.
3. **No Memory Leaks**: Because the component uses `products$ | async` in the HTML, Angular handles both the `.subscribe()` on load and the `.unsubscribe()` automatically when the user navigates away from the page.
