using System;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace SupportTicketSystem.Notifications;

public interface INotificationAppService : IApplicationService
{
    Task<ListResultDto<NotificationDto>> GetMyNotificationsAsync();
    Task<int> GetUnreadCountAsync();
    Task MarkAsReadAsync(Guid id);
    Task MarkAllAsReadAsync();
}