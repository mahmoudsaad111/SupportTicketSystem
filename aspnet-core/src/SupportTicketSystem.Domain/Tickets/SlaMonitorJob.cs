using Microsoft.Extensions.DependencyInjection;
using SupportTicketSystem.Domain.Shared.Tickets;
using SupportTicketSystem.Domain.Tickets;
using System;
using System.Linq;
using System.Threading.Tasks;
using Volo.Abp.BackgroundWorkers;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace SupportTicketSystem.Tickets;

public class SlaMonitorJob : AsyncPeriodicBackgroundWorkerBase
{
    public SlaMonitorJob(
        AbpAsyncTimer timer,
        IServiceScopeFactory serviceScopeFactory)
        : base(timer, serviceScopeFactory)
    {
        Timer.Period = 5 * 60 * 1000;
    }

    protected override async Task DoWorkAsync(
        PeriodicBackgroundWorkerContext workerContext)
    {
        var ticketRepository = workerContext.ServiceProvider
            .GetRequiredService<IRepository<Ticket, Guid>>();

        var queryable = await ticketRepository.GetQueryableAsync();

        var now = DateTime.UtcNow;

        var overdueTickets = await ticketRepository.GetListAsync(
           t => t.SlaDeadline < now &&
           t.SlaBreachedAt == null &&
           t.Status != TicketStatus.Resolved &&
           t.Status != TicketStatus.Closed
            );

        foreach (var ticket in overdueTickets)
        {
            ticket.MarkSlaBreached();

            await ticketRepository.UpdateAsync(ticket);
        }
    }
}