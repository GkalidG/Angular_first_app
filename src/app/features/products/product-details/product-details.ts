import { Product } from '@/app/core/models/domain.models';
import { CartService } from '@/app/core/services/cart.service';
import { CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-product-details',
  imports: [CurrencyPipe],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails {
  private http = inject(HttpClient);
  private cartService = inject(CartService);

  // Writable input signal for the selected product id
  productId = input.required<string>();

  // 1. Asynchronously fetch product details when productId changes
  productResource = rxResource({
    // 1. Establish the reactive trigger (dependencies)
    params: () => ({ id: this.productId() }),

    // 2. Fetch data via an Observable stream when params change
    stream: ({ params }) => this.http.get<Product>(`/api/products/${params.id}`),

    // 3. Optional: provide a default fallback value to avoid undefined states
    defaultValue: {
      id: '0',
      sku: '0',
      name: 'Loading...',
      price: 0,
      description: 'Loading...',
      inStock: true,
    },
  });

  // Shortcut for read-only fetched product
  product = computed(() => this.productResource.value());

  // 2. linkedSignal: quantity is writable, but reset to 1 whenever the product changes
  quantity = linkedSignal({
    source: this.product,
    computation: () => 1,
  });

  increment() {
    this.quantity.update((q) => q + 1);
  }

  decrement() {
    if (this.quantity() <= 1) {
      return;
    }

    this.quantity.update((q) => q - 1);
  }

  onAddToCart() {
    const currentProduct = this.product();
    if (currentProduct) {
      this.cartService.addToCart(currentProduct, this.quantity());
    }
  }
}
