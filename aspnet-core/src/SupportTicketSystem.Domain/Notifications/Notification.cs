using System;
using Volo.Abp.Domain.Entities.Auditing;
using Volo.Abp.MultiTenancy;

namespace SupportTicketSystem.Domain.Notifications;

public class Notification : CreationAuditedEntity<Guid>, IMultiTenant
{
    public Guid? TenantId { get; private set; }
    public Guid UserId { get; private set; }
    public string Title { get; private set; }
    public string Message { get; private set; }
    public Guid? TicketId { get; private set; }
    public bool IsRead { get; private set; }

    protected Notification()
    {
    }

    public Notification(
        Guid id,
        Guid? tenantId,
        Guid userId,
        string title,
        string message,
        Guid? ticketId = null)
        : base(id)
    {
        TenantId = tenantId;
        UserId = userId;
        Title = title;
        Message = message;
        TicketId = ticketId;
        IsRead = false;
    }

    public void MarkAsRead()
    {
        IsRead = true;
    }
}