using System;

namespace SupportTicketSystem.Domain.Tickets;

public class TicketCommentAddedEvent
{
    public Guid TicketId { get; }
    public Guid CommentId { get; }
    public Guid AuthorId { get; }

    public TicketCommentAddedEvent(Guid ticketId, Guid commentId, Guid authorId)
    {
        TicketId = ticketId;
        CommentId = commentId;
        AuthorId = authorId;
    }
}