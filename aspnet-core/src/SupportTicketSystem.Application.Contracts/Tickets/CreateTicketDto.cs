using SupportTicketSystem.Domain.Shared.Tickets;
using SupportTicketSystem.Tickets;
using System;
using System.ComponentModel.DataAnnotations;

namespace SupportTicketSystem.Tickets;

public class CreateTicketDto
{
    [Required]
    [StringLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    public PriorityLevel Priority { get; set; }

    public DateTime SlaDeadline { get; set; }
}