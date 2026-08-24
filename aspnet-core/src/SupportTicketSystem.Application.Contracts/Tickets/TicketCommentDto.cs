using SupportTicketSystem.Domain.Shared.Tickets;
using System;
using System.Collections.Generic;
using System.Text;

namespace SupportTicketSystem.Tickets
{
    public class TicketCommentDto
    {

        public Guid Id { get; set; }
        public Guid AuthorId { get; set; }
        public string Text { get; set; }
        public DateTime CreationTime { get; set; }

    }
}
