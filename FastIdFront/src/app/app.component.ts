import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from './core/auth.service';
import { AppBootstrapService } from './core/app-bootstrap.service';
import { ToolbarComponent } from './shared/components/toolbar/toolbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatProgressSpinnerModule, ToolbarComponent],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  boot = inject(AppBootstrapService);
  private auth = inject(AuthService);

  loading = true;

  ngOnInit(): void {
    this.auth.isReady$.subscribe((ready) => {
      if (ready || this.boot.bootError) {
        this.loading = false;
      }
    });
    if (this.boot.bootError) {
      this.loading = false;
    }
  }
}
