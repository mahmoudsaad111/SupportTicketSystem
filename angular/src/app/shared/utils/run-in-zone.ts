import { NgZone } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Pipeable operator that guarantees `next`/`error`/`complete` notifications
 * are delivered inside the given NgZone, so Angular always schedules change
 * detection after them.
 *
 * Why this is needed: Angular's HttpClient can be configured to use the
 * Fetch API instead of XHR (visible in DevTools Network as initiator
 * "fetch"). zone.js's monkey-patching of `fetch` has known gaps where a
 * response resolves outside the Angular zone, so component state gets
 * updated correctly in memory but the view is never told to re-render —
 * exactly the "request succeeds (200) but the UI stays on the loading
 * spinner forever" symptom. Wrapping subscription callbacks with this
 * operator sidesteps the issue entirely, regardless of which HTTP backend
 * or zone-patching behavior is in play.
 *
 * Usage:
 *   this.someService.getThing()
 *     .pipe(runInZone(this.ngZone))
 *     .subscribe(...)
 */
export function runInZone<T>(zone: NgZone) {
  return (source: Observable<T>): Observable<T> =>
    new Observable<T>(observer => {
      const subscription = source.subscribe({
        next: value => zone.run(() => observer.next(value)),
        error: err => zone.run(() => observer.error(err)),
        complete: () => zone.run(() => observer.complete()),
      });
      return () => subscription.unsubscribe();
    });
}
