Here is a complete, production-ready example of a real-time search component in Angular. It captures user keystrokes from an input field, processes them through a clean RxJS pipeline to prevent server overload, and streams live results to the UI.

### The TypeScript Component (`search.component.ts`)

```typescript
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  Subject,
  of,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  tap,
  takeUntil,
} from 'rxjs';

interface SearchResult {
  id: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
})
export class SearchComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);

  // 1. Reactive Form Control to track the input value
  searchControl = new FormControl('');

  // Observables for managing UI state
  results$!: Observable<SearchResult[]>;
  isLoading = false;
  errorMessage: string | null = null;

  // Subject used cleanly to teardown manual subscriptions on component destroy
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // 2. Build the real-time search pipeline
    this.results$ = this.searchControl.valueChanges.pipe(
      // Ensure we treat null/undefined as an empty string
      map((value) => value ?? ''),

      // Wait 300ms after the user stops typing before triggering the search
      debounceTime(300),

      // Only pass the value if it is different from the last emitted search term
      distinctUntilChanged(),

      // Set the loading spinner to true right before hitting the network
      tap(() => {
        this.isLoading = true;
        this.errorMessage = null;
      }),

      // Switch to the network call.
      // CRITICAL: If the user types a new character while an old search is still running,
      // switchMap automatically cancels the old HTTP request and starts the new one.
      switchMap((searchTerm: string) => {
        if (!searchTerm.trim()) {
          this.isLoading = false;
          return of([]); // Return an empty array instantly if input is cleared
        }
        return this.searchUsersApi(searchTerm);
      }),

      // Turn off the spinner once data arrives
      tap(() => (this.isLoading = false)),

      // Keep this subscription alive during component lifecycle
      takeUntil(this.destroy$),
    );
  }

  // Helper method executing the actual HTTP request
  private searchUsersApi(term: string): Observable<SearchResult[]> {
    const url = `https://api.example.com/search?q=${encodeURIComponent(term)}`;
    return this.http.get<SearchResult[]>(url).pipe(
      catchError((err) => {
        this.isLoading = false;
        this.errorMessage = 'Search failed. Please try again.';
        console.error(err);
        return of([]); // Return empty array so the main stream doesn't crash on error
      }),
    );
  }

  ngOnDestroy(): void {
    // Clean up the pipeline to avoid memory leaks
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

### The HTML Template (`search.component.html`)

```html
<div class="search-container">
  <h2>Live User Search</h2>

  <!-- Bind the input to our reactive form control -->
  <input
    type="text"
    [formControl]="searchControl"
    placeholder="Type to search users..."
    class="search-input"
  />

  <!-- Show loading state -->
  @if (isLoading) {
  <div class="spinner">Searching endpoints...</div>
  }

  <!-- Show error message -->
  @if (errorMessage) {
  <div class="error-msg">{{ errorMessage }}</div>
  }

  <!-- Stream results down to the template using the async pipe -->
  @if (results$ | async; as results) {
  <ul class="results-list">
    @for (item of results; track item.id) {
    <li>
      <strong>{{ item.name }}</strong>
      <p>{{ item.description }}</p>
    </li>
    } @empty { @if (!isLoading && searchControl.value) {
    <li class="no-results">No users found matching your search.</li>
    } }
  </ul>
  }
</div>
```

---

### Breaking Down the RxJS Trio

1. **`debounceTime(300)`**: Without this, if a user types the word `"Angular"`, the component will fire 7 separate HTTP requests to the server (one for `A`, `An`, `Ang`, etc.). Debounce forces it to wait until the user pauses typing for 300 milliseconds.
2. **`distinctUntilChanged()`**: If the user types a word, pauses (triggering a search), hits backspace, and quickly types the original letter back before the debounce window opens, the search term hasn't actually changed. This operator catches that edge case and blocks duplicate API hits.
3. **`switchMap()`**: This is the absolute core of safe autocomplete systems. If a network request for the search term `"Angu"` is slow, and the user types `"Angular"`, `switchMap` instantly aborts the pending network request for `"Angu"` and fires the new request. This guarantees the user never gets out-of-order search results.
