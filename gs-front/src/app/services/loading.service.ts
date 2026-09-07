import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly requestCounter$ = new BehaviorSubject<number>(0);
  readonly isLoading$: Observable<boolean> = this.requestCounter$.pipe(map((count) => count > 0));

  start(): void {
    this.requestCounter$.next(this.requestCounter$.value + 1);
  }

  stop(): void {
    const next = this.requestCounter$.value - 1;
    this.requestCounter$.next(next < 0 ? 0 : next);
  }
}
