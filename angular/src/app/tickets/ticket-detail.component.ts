import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConfigStateService, PermissionService } from '@abp/ng.core';
import { TicketService } from '../shared/services/ticket.service';
import { UserService } from '../shared/services/user.service';
import { IdentityUserDto } from '../shared/models/user.models';
import { runInZone } from '../shared/utils/run-in-zone';
import { getTicketActionError } from '../shared/utils/ticket-action-error';
import {
  TicketDto,
  TicketStatus,
  TicketStatusLabels,
  PriorityLevel,
  PriorityLevelLabels,
} from '../shared/models/ticket.models';

type ActionMode = 'reopen' | 'assign' | null;

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.scss'],
})
export class TicketDetailComponent implements OnInit {
  readonly TicketStatus = TicketStatus;
  readonly PriorityLevel = PriorityLevel;
  readonly TicketStatusLabels = TicketStatusLabels;
  readonly PriorityLevelLabels = PriorityLevelLabels;
  readonly priorityOptions = Object.values(PriorityLevel).filter(
    v => typeof v === 'number',
  ) as PriorityLevel[];

  ticketId = '';
  ticket: TicketDto | null = null;
  loading = true;
  loadError = false;

  actionMode: ActionMode = null;
  actionBusy = false;
  actionErrorMessage = '';
  reopenReason = '';
  assignAgentId = '';
  resetSlaDeadline = false;
  users: IdentityUserDto[] = [];
  usersLoading = false;

  commentText = '';
  commentBusy = false;
  commentErrorMessage = '';
  commentJustSubmitted = false;
  currentUserId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private ticketService: TicketService,
    private userService: UserService,
    private configState: ConfigStateService,
    private permissionService: PermissionService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.configState.getOne('currentUser')?.id ?? null;
    this.ticketId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadTicket();
    this.loadUsers();
  }

  loadTicket(): void {
    if (!this.ticketId) {
      this.loading = false;
      this.loadError = true;
      return;
    }
    this.loading = true;
    this.loadError = false;
    this.ticketService.get(this.ticketId).pipe(runInZone(this.ngZone)).subscribe({
      next: ticket => {
        this.ticket = ticket;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
        this.cdr.detectChanges();
      },
    });
  }

  statusBadgeClass(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.Open:
        return 'badge badge--blue';
      case TicketStatus.InProgress:
        return 'badge badge--purple';
      case TicketStatus.Resolved:
      case TicketStatus.Closed:
        return 'badge badge--green';
      case TicketStatus.Reopened:
        return 'badge badge--orange';
      default:
        return 'badge';
    }
  }

  userDisplayName(userId: string | null | undefined): string {
    if (!userId) return 'Unassigned';
    const user = this.users.find(item => item.id.toLowerCase() === userId.toLowerCase());
    if (!user) return 'Unknown user';
    return user.name || user.surname
      ? `${user.name ?? ''} ${user.surname ?? ''}`.trim()
      : user.userName;
  }

  priorityBadgeClass(priority: PriorityLevel): string {
    switch (priority) {
      case PriorityLevel.Low:
        return 'badge badge--green';
      case PriorityLevel.Medium:
        return 'badge badge--orange';
      case PriorityLevel.High:
        return 'badge badge--red';
      case PriorityLevel.Critical:
        return 'badge badge--purple';
      default:
        return 'badge';
    }
  }

  // ---- Actions (service methods return the updated TicketDto directly,
  // so we just swap it in rather than re-fetching). ----

  resolve(): void {
    if (!this.ticket || this.actionBusy || !this.canManageTicket(this.ticket)) return;
    this.ticket = { ...this.ticket, status: TicketStatus.Resolved };
    this.cdr.detectChanges();
    this.runAction(this.ticketService.resolve(this.ticket.id));
  }

  close(): void {
    if (!this.ticket || this.actionBusy || !this.canManageTicket(this.ticket)) return;
    this.ticket = { ...this.ticket, status: TicketStatus.Closed };
    this.cdr.detectChanges();
    this.runAction(this.ticketService.close(this.ticket.id));
  }

  changePriority(priority: PriorityLevel): void {
    if (!this.ticket || !this.canManageTicket(this.ticket) || priority === this.ticket.priority) return;
    this.runAction(this.ticketService.changePriority(this.ticket.id, { priority }));
  }

  openReopen(): void {
    if (!this.ticket || !this.canManageTicket(this.ticket)) return;
    this.reopenReason = '';
    this.actionErrorMessage = '';
    this.actionMode = 'reopen';
  }

  submitReopen(): void {
    if (!this.ticket || !this.canManageTicket(this.ticket)) return;
    if (!this.reopenReason.trim()) {
      this.actionErrorMessage = 'Please give a reason for reopening.';
      return;
    }
    this.runAction(this.ticketService.reopen(this.ticket.id, { reason: this.reopenReason }));
  }

  openAssign(): void {
    if (!this.ticket || !this.canAssignTicket(this.ticket)) return;
    this.assignAgentId = this.ticket?.assignedAgentId ?? '';
    this.resetSlaDeadline = !!this.ticket?.assignedAgentId;
    this.actionErrorMessage = '';
    this.actionMode = 'assign';
    this.loadUsers();
  }

  loadUsers(): void {
    this.usersLoading = true;
    this.userService.getList().subscribe({
      next: result => {
        this.users = result.items ?? [];
        this.usersLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.usersLoading = false;
        this.actionErrorMessage = "Couldn't load the user list. Please try again.";
        this.cdr.detectChanges();
      },
    });
  }

  submitAssign(): void {
    if (!this.ticket) return;
    if (!this.assignAgentId.trim()) {
      this.actionErrorMessage = 'Please select a user.';
      return;
    }
    this.runAction(this.ticketService.assign(this.ticket.id, {
      agentId: this.assignAgentId,
      resetSlaDeadline: this.resetSlaDeadline,
    }));
  }

  closeAction(): void {
    this.actionMode = null;
    this.actionErrorMessage = '';
    this.resetSlaDeadline = false;
  }

  private runAction(request: ReturnType<TicketService['resolve']>): void {
    this.actionBusy = true;
    this.actionErrorMessage = '';
    request.subscribe({
      next: updated => {
        if (updated?.id) {
          this.ticket = updated;
        }
        this.actionBusy = false;
        this.closeAction();
        this.cdr.detectChanges();
      },
      error: error => {
        this.actionBusy = false;
        this.actionErrorMessage = getTicketActionError(error, "That action couldn't be completed. Please try again.");
        this.loadTicket();
        this.cdr.detectChanges();
      },
    });
  }

  // ---- Comments ----
  // The API returns the comment history on the ticket response.

  submitComment(): void {
    if (!this.ticket || !this.commentText.trim()) return;
    this.commentBusy = true;
    this.commentErrorMessage = '';
    this.commentJustSubmitted = false;
    this.ticketService.addComment(this.ticket.id, { text: this.commentText }).subscribe({
      next: updated => {
        if (updated?.id) {
          this.ticket = updated;
        }
        this.commentBusy = false;
        this.commentJustSubmitted = true;
        this.commentText = '';
        this.cdr.detectChanges();
      },
      error: error => {
        this.commentBusy = false;
        this.commentErrorMessage = getTicketActionError(error, "Couldn't add the comment. Please try again.");
        this.cdr.detectChanges();
      },
    });
  }

  canManageTicket(ticket: TicketDto): boolean {
    const currentUserId = this.configState.getOne('currentUser')?.id ?? null;
    return (
      !!ticket.assignedAgentId &&
      !!currentUserId &&
      ticket.assignedAgentId.trim().toLowerCase() === currentUserId.trim().toLowerCase()
    );
  }

  canAssignTicket(ticket: TicketDto): boolean {
    const permission = ticket.assignedAgentId
      ? 'SupportTicketSystem.Tickets.ForceReassign'
      : 'SupportTicketSystem.Tickets.Assign';

    if (!this.permissionService.getGrantedPolicy(permission)) {
      return false;
    }

    return ticket.status !== TicketStatus.Closed && ticket.status !== TicketStatus.Resolved;
  }
}
