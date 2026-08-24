using System;
using Volo.Abp.Domain.Entities.Auditing;
    
namespace SupportTicketSystem.Domain.Tickets;

public class TicketComment : CreationAuditedEntity<Guid>
{
    public Guid TicketId { get; private set; }
    public Guid AuthorId { get; private set; }
    public string Text { get; private set; }

    protected TicketComment()
    {
    }

    internal TicketComment(Guid id, Guid ticketId, Guid authorId, string text)
        : base(id)
    {
        TicketId = ticketId;
        AuthorId = authorId;
        Text = text;
    }
}