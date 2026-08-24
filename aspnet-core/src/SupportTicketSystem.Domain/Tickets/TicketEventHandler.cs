using Microsoft.Extensions.Logging;
using SupportTicketSystem.Domain.Notifications;
using System;
using System.Threading.Tasks;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.EventBus;
using Volo.Abp.EventBus.Distributed;
using Volo.Abp.EventBus.Local;
using Volo.Abp.MultiTenancy;

namespace SupportTicketSystem.Domain.Tickets;

public class TicketEventHandler :
    ILocalEventHandler<TicketAssignedEvent>,
    ILocalEventHandler<TicketResolvedEvent>,
    ILocalEventHandler<TicketReopenedEvent>,
    ILocalEventHandler<TicketClosedEvent>,
    ILocalEventHandler<TicketCommentAddedEvent>,
    IDistributedEventHandler<TicketSlaBreachedEvent>,
    ITransientDependency
{
    private readonly ILogger<TicketEventHandler> _logger;
    private readonly IRepository<Ticket, Guid> _ticketRepository;
    private readonly IRepository<Notification, Guid> _notificationRepository;
    private readonly ICurrentTenant _currentTenant;

    public TicketEventHandler(
        ILogger<TicketEventHandler> logger,
        IRepository<Ticket, Guid> ticketRepository,
        IRepository<Notification, Guid> notificationRepository,
        ICurrentTenant currentTenant)
    {
        _logger = logger;
        _ticketRepository = ticketRepository;
        _notificationRepository = notificationRepository;
        _currentTenant = currentTenant;
    }

    public async Task HandleEventAsync(TicketAssignedEvent eventData)
    {
        _logger.LogInformation("Ticket {TicketId} assigned to agent {AgentId}",
            eventData.TicketId, eventData.AgentId);

        await CreateNotificationAsync(
            eventData.AgentId,
            "Ticket Assigned",
            $"You have been assigned ticket #{eventData.TicketId}.",
            eventData.TicketId);
    }

    public async Task HandleEventAsync(TicketResolvedEvent eventData)
    {
        _logger.LogInformation("Ticket {TicketId} resolved by agent {AgentId}",
            eventData.TicketId, eventData.ResolvedByAgentId);

        var ticket = await _ticketRepository.FindAsync(eventData.TicketId);
        if (ticket?.CreatorId != null)
        {
            await CreateNotificationAsync(
                ticket.CreatorId.Value,
                "Ticket Resolved",
                $"Your ticket #{eventData.TicketId} has been resolved.",
                eventData.TicketId);
        }
    }

    public async Task HandleEventAsync(TicketReopenedEvent eventData)
    {
        _logger.LogWarning("Ticket {TicketId} reopened by user {UserId}. Reason: {Reason}",
            eventData.TicketId, eventData.ReopenedByUserId, eventData.Reason);

        var ticket = await _ticketRepository.FindAsync(eventData.TicketId);
        if (ticket?.AssignedAgentId != null)
        {
            await CreateNotificationAsync(
                ticket.AssignedAgentId.Value,
                "Ticket Reopened",
                $"Ticket #{eventData.TicketId} was reopened. Reason: {eventData.Reason}",
                eventData.TicketId);
        }
    }

    public async Task HandleEventAsync(TicketClosedEvent eventData)
    {
        _logger.LogInformation("Ticket {TicketId} closed by user {UserId}",
            eventData.TicketId, eventData.ClosedByUserId);

        await Task.CompletedTask;
    }

    public async Task HandleEventAsync(TicketCommentAddedEvent eventData)
    {
        _logger.LogInformation("Comment {CommentId} added to ticket {TicketId} by {AuthorId}",
            eventData.CommentId, eventData.TicketId, eventData.AuthorId);

        var ticket = await _ticketRepository.FindAsync(eventData.TicketId);
        if (ticket == null)
        {
            return;
        }

        // Notify whichever side didn't write the comment.
        if (ticket.AssignedAgentId.HasValue && eventData.AuthorId == ticket.AssignedAgentId.Value
            && ticket.CreatorId.HasValue)
        {
            await CreateNotificationAsync(
                ticket.CreatorId.Value, "New Comment",
                $"A new comment was added to ticket #{eventData.TicketId}.", eventData.TicketId);
        }
        else if (ticket.AssignedAgentId.HasValue && eventData.AuthorId != ticket.AssignedAgentId.Value)
        {
            await CreateNotificationAsync(
                ticket.AssignedAgentId.Value, "New Comment",
                $"A new comment was added to ticket #{eventData.TicketId}.", eventData.TicketId);
        }
    }

    public async Task HandleEventAsync(TicketSlaBreachedEvent eventData)
    {
        _logger.LogWarning("SLA breached for ticket {TicketId}. Deadline was {SlaDeadline}",
            eventData.TicketId, eventData.SlaDeadline);

        var ticket = await _ticketRepository.FindAsync(eventData.TicketId);
        if (ticket?.AssignedAgentId != null)
        {
            await CreateNotificationAsync(
                ticket.AssignedAgentId.Value,
                "SLA Breached",
                $"Ticket #{eventData.TicketId} has breached its SLA deadline.",
                eventData.TicketId);
        }
    }

    private async Task CreateNotificationAsync(Guid userId, string title, string message, Guid ticketId)
    {
        var notification = new Notification(
            Guid.NewGuid(),
            _currentTenant.Id,
            userId,
            title,
            message,
            ticketId);

        await _notificationRepository.InsertAsync(notification);
    }
}