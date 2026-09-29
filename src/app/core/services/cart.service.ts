import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { CartItem, Product } from '@/app/core/models/domain.models';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  // Inject the platform ID token
  platformId = inject(PLATFORM_ID);

  // 1. Writable signal initialized with data from localstorage
  private cartItemsSignal = signal<CartItem[]>(this.localCartFromStorage());

  // Expose cart items as a read-only signal
  cartItems = this.cartItemsSignal.asReadonly();

  // 2. Computed signal for derived state
  cartCount = computed(() => this.cartItems().reduce((acc, item) => acc + item.quantity, 0));

  subtotal = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.product.price * item.quantity, 0),
  );
  tax = computed(() => this.subtotal() * 0.15); // 15% tax

  total = computed(() => this.subtotal() + this.tax());

  constructor() {
    // 3. Effects to async cart to localStorage whenever cartItemsSignal changes
    effect(() => {
      // Only write to localStorage if we are in the browser
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('shopping_cart', JSON.stringify(this.cartItems()));
      }
    });
  }

  addToCart(product: Product, quantity: number = 1) {
    this.cartItemsSignal.update((items) => {
      const existingItem = items.find((i) => i.product.id === product.id);

      if (existingItem) {
        //increment the quantity of the existing item
        return items.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }

      //add new product to cart
      return [...items, { product, quantity }];
    });
  }

  updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    this.cartItemsSignal.update((items) => {
      return items.map((item) => (item.product.id === productId ? { ...item, quantity } : item));
    });
  }

  removeFromCart(productId: string) {
    this.cartItemsSignal.update((items) => items.filter((item) => item.product.id !== productId));
  }

  clearCart() {
    this.cartItemsSignal.set([]);
  }

  private localCartFromStorage(): CartItem[] {
    // Only write to localStorage if we are in the browser
    if (isPlatformBrowser(this.platformId)) {
      const data = localStorage?.getItem('shopping_cart');

      return data ? JSON.parse(data) : [];
    }

    return [];
  }
}
