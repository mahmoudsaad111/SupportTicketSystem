using System;
using Volo.Abp.Application.Dtos;

namespace SupportTicketSystem.Notifications;

public class NotificationDto : EntityDto<Guid>
{
    public string Title { get; set; }
    public string Message { get; set; }
    public Guid? TicketId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreationTime { get; set; }
}