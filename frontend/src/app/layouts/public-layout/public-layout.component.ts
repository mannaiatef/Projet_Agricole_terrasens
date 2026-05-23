import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Public Layout Component
 * 
 * Used for unauthenticated routes:
 * - Landing page
 * - Login
 * - Register
 * 
 * Features:
 * - Full-screen immersive UI
 * - No sidebar or navigation bar
 * - Clean, minimal design
 * - Responsive layout
 */
@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="public-layout">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .public-layout {
      width: 100%;
      height: 100vh;
      overflow: hidden;
    }
  `]
})
export class PublicLayoutComponent {}
