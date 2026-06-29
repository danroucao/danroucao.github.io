import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  constructor(private router: Router, private authService: AuthService) {}

  onCreate(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigateByUrl('/backend');
      return;
    }

    this.router.navigate(['/login'], { queryParams: { redirectTo: '/backend' } });
  }

}
