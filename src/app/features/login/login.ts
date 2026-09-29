import { AuthService } from '@/app/core/services/auth.service';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  errorMsg = '';

  onLogin() {
    this.authService.login(); // Logs in

    // Redirect to original page attempt (returnUrl) or default to product
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/products';

    this.router.navigateByUrl(returnUrl);
  }
}
