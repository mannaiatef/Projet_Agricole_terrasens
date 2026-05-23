import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: any;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get current user info
    this.currentUser = this.authService.getCurrentUser();
  }

  /**
   * Logout user and navigate to login page
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
