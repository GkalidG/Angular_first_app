# Phase 2.1: Standalone Component Architecture

Angular 14 introduced Standalone Components, and since Angular 15+, it has become the standard way to build enterprise applications. We no longer need `NgModule` to declare our components!

## The `standalone: true` Primitive

By setting `standalone: true` in your `@Component` decorator, the component manages its own dependencies.

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../ui/button.component';

@Component({
  selector: 'app-product-card',
  standalone: true, // This makes it standalone!
  imports: [CommonModule, RouterModule, ButtonComponent],
  template: `
    <article class="card">
      <h3>{{ productName }}</h3>
      <app-button>Buy Now</app-button>
    </article>
  `,
})
export class ProductCardComponent {
  productName = 'Enterprise Router';
}
```

### Key Differences from NgModules:

1. **The `imports` array:** You directly import everything this specific component needs (other standalone components, directives, pipes, or legacy modules) right into the `@Component` decorator.
2. **Mental Model:** A component is now a self-contained unit. If it compiles, it runs. You don't have to hunt down which `NgModule` it was declared in.

## Bootstrapping a Standalone App

Since we don't have an `AppModule`, how do we start the app? We use `bootstrapApplication` in our `main.ts`.

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
```

The `appConfig` is where you provide application-wide services (like the Router, HttpClient).

---

# Phase 2.2: Built-In Control Flow Syntax

Angular v17 introduced a new, highly performant built-in control flow syntax. We no longer need `*ngIf`, `*ngFor`, or `*ngSwitch`!

### 1. Conditional Rendering (`@if`)

The new syntax is much cleaner and doesn't require a wrapping HTML element like `<ng-container>`.

```html
<!-- The Modern Way -->
@if (user.isAdmin) {
<button>Delete Product</button>
} @else if (user.isModerator) {
<button>Edit Product</button>
} @else {
<p>Read-only mode</p>
}
```

### 2. Iterating Over Lists (`@for`)

The `@for` block requires a `track` expression. This is critical for performance because it tells Angular how to uniquely identify items in the DOM during updates.

```html
<ul>
  @for (product of products; track product.id) {
  <li>{{ product.name }} - {{ product.price | currency }}</li>
  } @empty {
  <li>No products found.</li>
  }
</ul>
```

_Notice the `@empty` block! It automatically renders if the `products` array is empty or undefined._

### 3. Switch Statements (`@switch`)

```html
@switch (orderStatus) { @case ('pending') {
<span class="badge warning">Pending</span>
} @case ('shipped') {
<span class="badge success">Shipped</span>
} @default {
<span class="badge gray">Unknown</span>
} }
```

---

**Next Steps:** Please review the standalone architecture and the new control flow syntax. Let me know if you have any questions, or if you are ready to move on to **Phase 2.3 Deferred Loading (`@defer`)** where things get really exciting for performance!

# Phase 2.3: Deferred Loading (`@defer`)

One of the most powerful features introduced in Angular 17 is **Deferred Loading** via the `@defer` block. It allows you to lazy-load components, directives, and pipes at the template level with zero configuration.

In enterprise apps, this is a game-changer for performance (especially Core Web Vitals like LCP and TBT), as it keeps initial bundle sizes small.

## Basic Structure of `@defer`

A `@defer` block has four main parts:

```html
@defer {
<!-- This content will be lazy-loaded -->
<app-heavy-chart [data]="chartData" />
} @placeholder {
<!-- Shown initially before loading starts -->
<div class="skeleton">Chart is loading...</div>
} @loading {
<!-- Shown while the bundle is actively downloading -->
<app-spinner />
} @error {
<!-- Shown if downloading the bundle fails -->
<p>Failed to load the chart.</p>
}
```

## Triggers

You can control _when_ the deferred content loads using **Triggers**. You can combine them using `on` (declarative triggers) and `when` (imperative conditions).

### 1. `on idle` (Default)

Loads the bundle once the browser is idle.

```html
@defer (on idle) { ... }
```

### 2. `on viewport`

Loads the bundle when the placeholder enters the browser viewport. Perfect for content further down the page!

```html
@defer (on viewport) {
<app-reviews-section />
} @placeholder {
<div>Scroll down to see reviews</div>
}
```

### 3. `on interaction`

Loads the bundle when the user clicks or focuses on the placeholder (or a designated element).

```html
@defer (on interaction) {
<app-comments-modal />
} @placeholder {
<button>Show Comments</button>
}
```

### 4. `on hover`

Loads when the user hovers over the placeholder.

```html
@defer (on hover) {
<app-tooltip-details />
} @placeholder {
<span>Hover for details</span>
}
```

### 5. `on timer`

Loads after a specific duration.

```html
@defer (on timer(5s)) { ... }
```

### 6. `when` (Imperative Condition)

Loads based on a boolean expression (like a signal or variable).

```html
@defer (when isUserAuthenticated()) {
<app-premium-feature />
}
```

---

# Phase 2.4: Modern DI & Component Communication

Modern Angular has moved away from constructor injection and traditional `@Input` / `@Output` decorators in favor of the `inject()` function and **Signal-based inputs/outputs**.

## 1. The `inject()` Function

Instead of injecting dependencies in the constructor, you inject them directly into class properties. This is cleaner, fits functional guards/interceptors, and plays nicely with inheritance.

```typescript
import { Component, inject } from '@angular/core';
import { ProductService } from './product.service';

@Component({...})
export class ProductListComponent {
  // Functional Injection!
  private productService = inject(ProductService);
}
```

## 2. Signal Inputs (`input()`)

Signal inputs represent inputs as a `Signal` instead of a plain value. They make reacting to input changes pure and highly efficient.

- **Optional Input:** `input<string>()` (Returns `Signal<string | undefined>`)
- **Required Input:** `input.required<string>()` (Returns `Signal<string>`)
- **Input with Default Value:** `input('Default Title')` (Returns `Signal<string>`)

```typescript
import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-product-badge',
  standalone: true,
  template: `<span>{{ discountText() }}</span>`,
})
export class ProductBadgeComponent {
  price = input.required<number>(); // Signal input
  discount = input<number>(0); // Signal input with default

  // Reacts automatically to changes in price or discount
  discountText = computed(() => {
    return `Save $${this.price() * (this.discount() / 100)}`;
  });
}
```

## 3. Signal Outputs (`output()`)

Outputs are also modernized! They do not use signals internally (since they are emitters, not state), but they use a simpler functional API.

```typescript
import { Component, output } from '@angular/core';

@Component({...})
export class ProductCardComponent {
  // Modern Output
  addToCart = output<string>();

  triggerAdd() {
    this.addToCart.emit('product_id_123');
  }
}
```

## 4. Two-Way Binding (`model()`)

Angular now provides a `model()` function for defining a two-way binding. It acts as both an `input` (signal) and an `output` (automatically emits events when updated).

```typescript
import { Component, model } from '@angular/core';

@Component({
  selector: 'app-toggle',
  standalone: true,
  template: `<button (click)="toggle()">State: {{ checked() }}</button>`,
})
export class ToggleComponent {
  checked = model<boolean>(false); // Two-way binding

  toggle() {
    this.checked.update((val) => !val); // Automatically emits change to parent!
  }
}
```

---

**Next Steps:** Let me know if you have any questions on `@defer` triggers or the new `input()`, `output()`, and `model()` primitives. If you are ready, we will tackle **Phase 2.5 Practical Project: Standalone Storefront UI**!
