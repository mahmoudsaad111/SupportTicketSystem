import { Injectable, NgZone, inject } from '@angular/core';
import { RestService } from '@abp/ng.core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { runInZone } from '../utils/run-in-zone';

interface UserLookupData {
  id?: string;
  userName?: string;
  name?: string;
  surname?: string;
}

/**
 * Resolves ticket-assigned-agent GUIDs to display names by calling ABP's
 * identity user lookup endpoint directly via RestService (rather than the
 * generated IdentityUserLookupService proxy).
 *
 * Why: the generated proxy's `findById(id)` has no config parameter, so
 * there's no way to pass `skipHandleError`. A failed lookup (e.g. the
 * current user's role doesn't have the lookup permission) still gets
 * caught locally by `catchError` below and falls back to the raw GUID --
 * but ABP's global HTTP error interceptor reacts to the 401/403 BEFORE
 * that local catchError runs, independent of it, and redirects to an
 * "unauthorized" page. `skipHandleError: true` tells that interceptor to
 * leave this specific request alone, so a failed lookup degrades silently
 * to a raw GUID in the CSV instead of interrupting the whole export flow.
 */
@Injectable({ providedIn: 'root' })
export class AgentNameResolverService {
  apiName = 'Default';
  private readonly restService = inject(RestService);
  private readonly ngZone = inject(NgZone);

  /**
   * Resolves a list of agent GUIDs (duplicates and null/undefined allowed)
   * to a Map<agentId, displayName>. IDs that fail to resolve fall back to
   * showing the raw GUID rather than breaking the whole export.
   */
  resolveNames(agentIds: (string | null | undefined)[]): Observable<Map<string, string>> {
    const uniqueIds = Array.from(new Set(agentIds.filter((id): id is string => !!id)));

    if (uniqueIds.length === 0) {
      return of(new Map<string, string>());
    }

    const lookups = uniqueIds.map(id =>
      this.restService
        .request<any, UserLookupData>(
          {
            method: 'GET',
            url: `/api/identity/users/lookup/${id}`,
          },
          { apiName: this.apiName, skipHandleError: true },
        )
        .pipe(
          runInZone(this.ngZone),
          map(user => {
            const fullName = [user.name, user.surname].filter(Boolean).join(' ').trim();
            return { id, name: fullName || user.userName || id };
          }),
          catchError(() => of({ id, name: id })),
        ),
    );

    return forkJoin(lookups).pipe(map(results => new Map(results.map(r => [r.id, r.name]))));
  }
}
