// Mirrors SupportTicketSystem.Domain.Shared.Tickets.TicketStatus (aspnet-core)
export enum TicketStatus {
  Open = 0,
  InProgress = 1,
  Resolved = 2,
  Reopened = 3,
  Closed = 4,
}

// Mirrors SupportTicketSystem.Domain.Shared.Tickets.PriorityLevel (aspnet-core)
export enum PriorityLevel {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3,
}

export const TicketStatusLabels: Record<TicketStatus, string> = {
  [TicketStatus.Open]: 'Open',
  [TicketStatus.InProgress]: 'In Progress',
  [TicketStatus.Resolved]: 'Resolved',
  [TicketStatus.Reopened]: 'Reopened',
  [TicketStatus.Closed]: 'Closed',
};

export const PriorityLevelLabels: Record<PriorityLevel, string> = {
  [PriorityLevel.Low]: 'Low',
  [PriorityLevel.Medium]: 'Medium',
  [PriorityLevel.High]: 'High',
  [PriorityLevel.Critical]: 'Critical',
};

// Mirrors SupportTicketSystem.Tickets.TicketDto
export interface TicketDto {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: PriorityLevel;
  assignedAgentId?: string | null;
  slaDeadline: string; // ISO date string
  comments: TicketCommentDto[];
}

export interface TicketCommentDto {
  id: string;
  authorId: string;
  text: string;
  creationTime: string;
}

// Mirrors SupportTicketSystem.Tickets.GetTicketListDto
export interface GetTicketListDto {
  status?: TicketStatus | null;
  assignedAgentId?: string | null;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}

// Mirrors Volo.Abp.Application.Dtos.PagedResultDto<TicketDto>
export interface PagedResultDto<T> {
  totalCount: number;
  items: T[];
}

// Mirrors Volo.Abp.Application.Dtos.ListResultDto<TicketDto>
export interface ListResultDto<T> {
  items: T[];
}

// Mirrors SupportTicketSystem.Tickets.CreateTicketDto
export interface CreateTicketDto {
  title: string;
  description: string;
  priority: PriorityLevel;
}

// Mirrors SupportTicketSystem.Tickets.AssignTicketDto
export interface AssignTicketDto {
  agentId: string;
  resetSlaDeadline: boolean;
}

// Mirrors SupportTicketSystem.Tickets.ReopenTicketDto
export interface ReopenTicketDto {
  reason: string;
}

// Mirrors SupportTicketSystem.Tickets.ChangeTicketPriorityDto
export interface ChangeTicketPriorityDto {
  priority: PriorityLevel;
}

// Mirrors SupportTicketSystem.Tickets.AddTicketCommentDto
export interface AddTicketCommentDto {
  text: string;
}
