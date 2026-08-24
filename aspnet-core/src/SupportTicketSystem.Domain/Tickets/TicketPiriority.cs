using System;
using Volo.Abp.Domain.Values;
using System.Collections.Generic;
using SupportTicketSystem.Domain.Shared.Tickets;

namespace SupportTicketSystem.Domain.Tickets;

public class TicketPriority : ValueObject
{
    public static TicketPriority Low => new(PriorityLevel.Low, TimeSpan.FromDays(7));
    public static TicketPriority Medium => new(PriorityLevel.Medium, TimeSpan.FromHours(72));
    public static TicketPriority High => new(PriorityLevel.High, TimeSpan.FromHours(24));
    public static TicketPriority Critical => new(PriorityLevel.Critical, TimeSpan.FromHours(4));

    public PriorityLevel Level { get; } = PriorityLevel.Low;
    public TimeSpan SlaWindow { get; }

    private TicketPriority(PriorityLevel level, TimeSpan slaWindow)
    {
        Level = level;
        SlaWindow = slaWindow;
    }

    public DateTime CalculateDeadline(DateTime from) => from.Add(SlaWindow);

    protected override IEnumerable<object> GetAtomicValues()
    {
        yield return Level;
    }
}

