import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'MedLab - HGD';
  
  @ViewChild('drawer') drawer!: MatSidenav;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  get isPublicRoute(): boolean {
    return this.router.url.startsWith('/public') || this.router.url === '/login';
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  getUserInitials(): string {
    const user = this.currentUser;
    if (!user) return '?';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  }

  getRoleLabel(): string {
    const user = this.currentUser;
    if (!user) return '';
    return user.role === 'ADMIN' ? 'Administrateur' : 'Technicien';
  }

  logout(): void {
    this.authService.logout();
  }
}
