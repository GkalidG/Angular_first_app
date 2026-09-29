// Discriminant Union for Order Status
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: ('admin' | 'customer')[];
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  description: string;
  inStock: boolean;
}

export interface Order {
  id: string;
  userId: string;
  items: Array<{ productId: string; quantity: number }>;
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
