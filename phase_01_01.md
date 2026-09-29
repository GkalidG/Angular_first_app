# Phase 1.1: Enterprise TypeScript Core

Welcome to our first tutoring session! Today we will focus on **Enterprise TypeScript Core**. Before architecting complex Angular applications, it is essential to master modern TypeScript.

## 1. Strict Type Safety

In an enterprise application, you want the TypeScript compiler to catch as many errors as possible before runtime.

Enable strict mode in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

- `strict: true` enables a wide range of type checking behavior that results in stronger guarantees of program correctness.
- `noImplicitAny: true` raises an error on expressions and declarations with an implied `any` type, forcing you to define types explicitly.

## 2. Advanced Generics

Generics allow you to create reusable components, API wrappers, and repositories that can work over a variety of types rather than a single one.

### Example: API Wrapper

```typescript
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// Usage
const userResponse: ApiResponse<User> = await fetchUser();
const productResponse: ApiResponse<Product> = await fetchProduct();
```

## 3. Utility Types

TypeScript provides several global utility types to facilitate common type transformations.

- **`Partial<T>`**: Constructs a type with all properties of T set to optional. Useful for updates/patches.
- **`Required<T>`**: Constructs a type consisting of all properties of T set to required.
- **`Readonly<T>`**: Constructs a type with all properties of T set to readonly.
- **`Record<K, T>`**: Constructs an object type whose property keys are K and whose property values are T.
- **`Pick<T, K>`**: Constructs a type by picking the set of properties K from T.
- **`Omit<T, K>`**: Constructs a type by picking all properties from T and then removing K.

### Example: Updating a User

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

// Partial allows us to pass only the fields we want to update
function updateUser(id: string, changes: Partial<User>) {
  // implementation...
}

updateUser('123', { name: 'John Doe' }); // Valid
```

## 4. Type Narrowing & Guards

When working with union types, you often need to narrow the type down to a specific one.

### Custom Type Guards

A function whose return type is a type predicate (`parameterName is Type`).

```typescript
function isUser(obj: any): obj is User {
  return obj && typeof obj.name === 'string' && typeof obj.email === 'string';
}

if (isUser(data)) {
  // TypeScript knows `data` is a User here
  console.log(data.email);
}
```

### Discriminant Unions & Exhaustiveness Checks

Discriminant unions are a pattern where a union type has a common property with literal types (a "discriminant").

```typescript
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function handleState<T>(state: AsyncState<T>) {
  switch (state.status) {
    case 'idle':
      return 'Waiting to start...';
    case 'loading':
      return 'Loading...';
    case 'success':
      return `Data loaded: ${state.data}`;
    case 'error':
      return `Error: ${state.error.message}`;
    default:
      // Exhaustiveness check: if we added a new status and forgot to handle it,
      // this line would cause a TypeScript error because `state` wouldn't be `never`.
      const _exhaustiveCheck: never = state;
      return _exhaustiveCheck;
  }
}
```

---

**Next Steps**: Please review this material. Let me know if you have any questions or if you're ready to proceed to **1.2 Toolchain & Workspace Setup**.
