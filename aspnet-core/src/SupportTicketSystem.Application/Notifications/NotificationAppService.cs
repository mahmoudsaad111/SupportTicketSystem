using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using SupportTicketSystem.Domain.Notifications;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;

namespace SupportTicketSystem.Notifications;

[Authorize]
public class NotificationAppService : SupportTicketSystemAppService, INotificationAppService
{
    private readonly IRepository<Notification, Guid> _notificationRepository;

    public NotificationAppService(IRepository<Notification, Guid> notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task<ListResultDto<NotificationDto>> GetMyNotificationsAsync()
    {
        var currentUserId = CurrentUser.GetId();
        var queryable = await _notificationRepository.GetQueryableAsync();

        var notifications = queryable
            .Where(n => n.UserId == currentUserId)
            .OrderByDescending(n => n.CreationTime)
            .Take(50)
            .ToList();

        return new ListResultDto<NotificationDto>(notifications.Select(ToDto).ToList());
    }

    public async Task<int> GetUnreadCountAsync()
    {
        var currentUserId = CurrentUser.GetId();
        var queryable = await _notificationRepository.GetQueryableAsync();

        return queryable.Count(n => n.UserId == currentUserId && !n.IsRead);
    }

    public async Task MarkAsReadAsync(Guid id)
    {
        var notification = await _notificationRepository.GetAsync(id);
        notification.MarkAsRead();
        await _notificationRepository.UpdateAsync(notification);
    }

    public async Task MarkAllAsReadAsync()
    {
        var currentUserId = CurrentUser.GetId();
        var queryable = await _notificationRepository.GetQueryableAsync();

        var unread = queryable.Where(n => n.UserId == currentUserId && !n.IsRead).ToList();
        foreach (var n in unread)
        {
            n.MarkAsRead();
            await _notificationRepository.UpdateAsync(n);
        }
    }

    private static NotificationDto ToDto(Notification n) => new()
    {
        Id = n.Id,
        Title = n.Title,
        Message = n.Message,
        TicketId = n.TicketId,
        IsRead = n.IsRead,
        CreationTime = n.CreationTime
    };
}