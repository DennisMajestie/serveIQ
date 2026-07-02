import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected title = 'waiter';

  ngOnInit() {
    if ('fonts' in document) {
      (document as any).fonts.ready.then(() => {
        document.body.classList.add('fonts-loaded');
      });
    } else {
      setTimeout(() => {
        document.body.classList.add('fonts-loaded');
      }, 300);
    }
  }
}
