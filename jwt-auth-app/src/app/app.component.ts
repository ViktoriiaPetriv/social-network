import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="app-container">
      <header>
        <h1>JWT Auth App</h1>
      </header>
      <main>
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    header {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      padding: 1rem 2rem;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    header h1 {
      margin: 0;
      color: white;
      font-size: 2rem;
      font-weight: 300;
    }

    main {
      padding: 2rem;
    }
  `]
})
export class AppComponent {
  title = 'jwt-auth-app';
}
