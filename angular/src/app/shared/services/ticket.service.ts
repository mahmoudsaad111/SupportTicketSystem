import { Injectable, NgZone } from '@angular/core';
import { RestService } from '@abp/ng.core';
import { tap } from 'rxjs';
import { NotificationService } from './notification.service';
import { runInZone } from '../utils/run-in-zone';
import type {
  AddTicketCommentDto,
  AssignTicketDto,
  ChangeTicketPriorityDto,
  CreateTicketDto,
  GetTicketListDto,
  ListResultDto,
  PagedResultDto,
  ReopenTicketDto,
  TicketDto,
} from '../models/ticket.models';

// Talks to SupportTicketSystem.Tickets.TicketAppService (aspnet-core) via ABP's
// auto-generated dynamic API controller conventions. Route mapping:
//   GetListAsync            -> GET    /api/app/ticket
//   GetAsync(id)             -> GET    /api/app/ticket/{id}
//   CreateAsync              -> POST   /api/app/ticket
//   AssignAsync(id)          -> POST   /api/app/ticket/{id}/assign
//   ResolveAsync(id)         -> POST   /api/app/ticket/{id}/resolve
//   ReopenAsync(id)          -> POST   /api/app/ticket/{id}/reopen
//   CloseAsync(id)           -> POST   /api/app/ticket/{id}/close
//   ChangePriorityAsync(id)  -> POST   /api/app/ticket/{id}/change-priority
//   AddCommentAsync(id)      -> POST   /api/app/ticket/{id}/comment
//   GetOverdueTicketsAsync   -> GET    /api/app/ticket/overdue-tickets
@Injectable({ providedIn: 'root' })
export class TicketService {
  apiName = 'Default';

  constructor(
    private restService: RestService,
    private ngZone: NgZone,
    private notificationService: NotificationService,
  ) {}

  getList = (input: GetTicketListDto) =>
    this.restService.request<any, PagedResultDto<TicketDto>>(
      {
        method: 'GET',
        url: '/api/app/ticket',
        params: {
          status: input.status,
          assignedAgentId: input.assignedAgentId,
          sorting: input.sorting,
          skipCount: input.skipCount,
          maxResultCount: input.maxResultCount,
        },
      },
      { apiName: this.apiName },
    ).pipe(runInZone(this.ngZone));

  get = (id: string) =>
    this.restService.request<any, TicketDto>(
      { method: 'GET', url: `/api/app/ticket/${id}` },
      { apiName: this.apiName },
    ).pipe(runInZone(this.ngZone));

  create = (input: CreateTicketDto) =>
    this.restService.request<any, TicketDto>(
      { method: 'POST', url: '/api/app/ticket', body: input },
      { apiName: this.apiName },
    ).pipe(runInZone(this.ngZone));

  assign = (id: string, input: AssignTicketDto) =>
    this.restService.request<any, TicketDto>(
      { method: 'POST', url: `/api/app/ticket/${id}/assign`, body: input },
      { apiName: this.apiName },
    ).pipe(runInZone(this.ngZone), tap(() => this.notificationService.refreshUnreadCount()));

  resolve = (id: string) =>
    this.restService.request<any, TicketDto>(
      { method: 'POST', url: `/api/app/ticket/${id}/resolve` },
      { apiName: this.apiName },
    ).pipe(runInZone(this.ngZone), tap(() => this.notificationService.refreshUnreadCount()));

  reopen = (id: string, input: ReopenTicketDto) =>
    this.restService.request<any, TicketDto>(
      { method: 'POST', url: `/api/app/ticket/${id}/reopen`, body: input },
      { apiName: this.apiName },
    ).pipe(runInZone(this.ngZone), tap(() => this.notificationService.refreshUnreadCount()));

  close = (id: string) =>
    this.restService.request<any, TicketDto>(
      { method: 'POST', url: `/api/app/ticket/${id}/close` },
      { apiName: this.apiName },
    ).pipe(runInZone(this.ngZone), tap(() => this.notificationService.refreshUnreadCount()));

  changePriority = (id: string, input: ChangeTicketPriorityDto) =>
    this.restService.request<any, TicketDto>(
      { method: 'POST', url: `/api/app/ticket/${id}/change-priority`, body: input },
      { apiName: this.apiName },
    ).pipe(runInZone(this.ngZone), tap(() => this.notificationService.refreshUnreadCount()));

  addComment = (id: string, input: AddTicketCommentDto) =>
    this.restService.request<any, TicketDto>(
      { method: 'POST', url: `/api/app/ticket/${id}/comment`, body: input },
      { apiName: this.apiName },
    ).pipe(runInZone(this.ngZone), tap(() => this.notificationService.refreshUnreadCount()));

  getOverdueTickets = () =>
    this.restService.request<any, ListResultDto<TicketDto>>(
      { method: 'GET', url: '/api/app/ticket/overdue-tickets' },
      { apiName: this.apiName },
    ).pipe(runInZone(this.ngZone));
}
