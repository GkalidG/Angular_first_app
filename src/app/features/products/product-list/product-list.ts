import { Product } from '@/app/core/models/domain.models';
import { CartService } from '@/app/core/services/cart.service';
import { ProductService } from '@/app/core/services/product.service';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HeavyAnalyticsChart } from '../../analytics/heavy-analytics-chart/heavy-analytics-chart';
import { ProductCard } from '../product-card/product-card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-product-list',
  imports: [HeavyAnalyticsChart, ProductCard, RouterLink],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList {
  private productService = inject(ProductService);
  private cartService = inject(CartService);

  // Bridge the HTTP stream into an Angular Signal
  products = toSignal(this.productService.getProducts(), { initialValue: [] });

  handleAddToCart(product: Product) {
    this.cartService.addToCart(product, 1);
  }
}
