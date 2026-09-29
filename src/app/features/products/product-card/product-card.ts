import { Component, input, output } from '@angular/core';
import { Product } from '@/app/core/models/domain.models';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {
  product = input.required<Product>();
  addToCart = output<string>(); // Emits product SKU

  onAddToCart() {
    this.addToCart.emit(this.product().sku);
  }
}
