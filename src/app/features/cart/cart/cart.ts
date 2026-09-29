import { CartService } from '@/app/core/services/cart.service';
import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';

@Component({
  selector: 'app-cart',
  imports: [CurrencyPipe],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  // Inject cartService to access computed metrics
  protected cartService = inject(CartService);

  onRemove(productId: string) {
    this.cartService.removeFromCart(productId);
  }

  onUpdateQty(productId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    this.cartService.updateQuantity(productId, parseInt(input.value, 10));
  }
}
