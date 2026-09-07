import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article [class]="cardClasses">
      <ng-content></ng-content>
    </article>
  `,
  styles: [`
    article {
      border-radius: var(--border-radius-lg);
      border: 1px solid var(--border-color);
      background: var(--background-white);
      box-shadow: var(--shadow-xs);
      transition: box-shadow 0.2s ease, transform 0.2s ease;
    }

    .ui-card-p-sm { padding: 1rem; }
    .ui-card-p-md { padding: 1.5rem; }
    .ui-card-p-lg { padding: 2rem; }

    .ui-card-interactive:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
  `]
})
export class UiCardComponent {
  @Input() padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  @Input() interactive = false;

  get cardClasses(): string {
    const paddingClass = this.padding === 'none' ? '' : ` ui-card-p-${this.padding}`;
    const interactive = this.interactive ? ' ui-card-interactive' : '';
    return `${paddingClass}${interactive}`.trim();
  }
}
