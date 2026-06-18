import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-open-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './open-tab.component.html',
  styleUrls: ['./open-tab.component.scss']
})
export class OpenTabComponent {
  @Input() tableName = 'Table X';

  customerName = '';
  numPeople = 1;

  private router = inject(Router);

  cancel() {
    // If opened as a modal via router, navigate back
    this.router.navigate(['/tables']);
  }

  confirm() {
    // For now, just navigate to tables
    this.router.navigate(['/tables']);
  }
}
