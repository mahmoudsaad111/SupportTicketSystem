// Mirrors SupportTicketSystem.Notifications.NotificationDto
export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  ticketId?: string | null;
  isRead: boolean;
  creationTime: string; // ISO date string
}

// Mirrors Volo.Abp.Application.Dtos.ListResultDto<NotificationDto>
export interface ListResultDto<T> {
  items: T[];
}
