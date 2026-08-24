import { Injectable, NgZone, inject } from '@angular/core';
import { RestService } from '@abp/ng.core';
import { UserListResultDto } from '../models/user.models';
import { runInZone } from '../utils/run-in-zone';

@Injectable({ providedIn: 'root' })
export class UserService {
  apiName = 'Default';
  private readonly restService = inject(RestService);
  private readonly ngZone = inject(NgZone);

  getList = () =>
    this.restService.request<any, UserListResultDto>(
      {
        method: 'GET',
        url: '/api/identity/users',
        params: {
          sorting: 'UserName asc',
          maxResultCount: 1000,
        },
      },
      { apiName: this.apiName },
    ).pipe(runInZone(this.ngZone));
}
