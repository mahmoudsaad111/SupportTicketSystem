using System.ComponentModel.DataAnnotations;

namespace SupportTicketSystem.Tickets;

public class ReopenTicketDto
{
    [Required]
    public string Reason { get; set; } = string.Empty;
}