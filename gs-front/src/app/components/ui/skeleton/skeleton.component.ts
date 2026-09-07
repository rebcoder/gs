import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="skeletonClasses"></div>
  `,
  styles: [`
    div {
      background: var(--background-gray);
    }
  `]
})
export class UiSkeletonComponent {
  @Input() rounded: 'none' | 'sm' | 'md' | 'lg' | 'full' = 'md';
  @Input() heightClass = 'h-4';
  @Input() widthClass = 'w-full';

  get skeletonClasses(): string {
    const rounding = this.rounded === 'none'
      ? ''
      : this.rounded === 'full'
      ? ' rounded-full'
      : this.rounded === 'lg'
        ? ' rounded-xl'
        : this.rounded === 'sm'
          ? ' rounded'
          : ' rounded-md';
    return `animate-pulse${rounding} ${this.heightClass} ${this.widthClass}`;
  }
}
