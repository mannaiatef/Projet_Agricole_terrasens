import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Root Application Component
 * 
 * This is the top-level component that serves as the entry point for the entire application.
 * 
 * Architecture:
 * - Contains only a single router-outlet
 * - All layout logic is delegated to layout components (PublicLayout, DashboardLayout)
 * - Routes determine which layout is used
 * - No conditional logic or layout switching here
 * 
 * Layout Routing:
 * - "/" → PublicLayout (landing, login, register) - No sidebar
 * - "/app/*" → DashboardLayout (authenticated routes) - With sidebar
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: `<router-outlet></router-outlet>`,
  styles: []
})
export class AppComponent {}
