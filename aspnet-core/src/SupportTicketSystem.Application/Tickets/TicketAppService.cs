using SupportTicketSystem.Domain.Shared.Tickets;
using SupportTicketSystem.Domain.Tickets;
using SupportTicketSystem.Permissions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Authorization;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;
using System.Linq.Dynamic.Core;
using Microsoft.AspNetCore.Authorization;

namespace SupportTicketSystem.Tickets;
[Authorize]
public class TicketAppService : SupportTicketSystemAppService, ITicketAppService
{
    private readonly IRepository<Ticket, Guid> _ticketRepository;
    private readonly IRepository<TicketComment, Guid> _ticketCommentRepository; 

    public TicketAppService(IRepository<Ticket, Guid> ticketRepository)
    {
        _ticketRepository = ticketRepository;
    }
    public async Task<PagedResultDto<TicketDto>> GetListAsync(GetTicketListDto input)
    {
        var queryable = await _ticketRepository.GetQueryableAsync();

        queryable = queryable
            .WhereIf(input.Status.HasValue, t => t.Status == input.Status)
            .WhereIf(input.AssignedAgentId.HasValue, t => t.AssignedAgentId == input.AssignedAgentId);

        var totalCount = queryable.Count();

        var tickets = queryable
            .OrderBy(string.IsNullOrWhiteSpace(input.Sorting) ? "CreationTime DESC" : input.Sorting)
            .Skip(input.SkipCount)
            .Take(input.MaxResultCount)
            .ToList();

        return new PagedResultDto<TicketDto>(
            totalCount,
            tickets.Select(ToDto).ToList());
    }

    [Authorize(SupportTicketSystemPermissions.Tickets.Create)]
    public async Task<TicketDto> CreateAsync(CreateTicketDto input)
    {
        var priority = ToTicketPriority(input.Priority);

        var ticket = Ticket.Create(
            id: Guid.NewGuid(),
            tenantId: CurrentTenant.Id,
            title: input.Title,
            description: input.Description,
            priority: priority);

        await _ticketRepository.InsertAsync(ticket);

        return ToDto(ticket);
    }

    public async Task<TicketDto> GetAsync(Guid id)
    {
        var ticket = await _ticketRepository.GetAsync(id);
        return ToDto(ticket);
    }
 
    [Authorize(SupportTicketSystemPermissions.Tickets.Assign)]
    public async Task<TicketDto> AssignAsync(Guid id, AssignTicketDto input)
    {
        var ticket = await _ticketRepository.GetAsync(id);
        var currentUserId = CurrentUser.GetId();

        if (ticket.AssignedAgentId.HasValue)
        {
            await AuthorizationService.CheckAsync(SupportTicketSystemPermissions.Tickets.ForceReassign);
            ticket.ForceReassignTo(input.AgentId, input.ResetSlaDeadline);
        }
        else
        {
            ticket.AssignTo(currentUserId, input.AgentId);
            if (input.ResetSlaDeadline)
                ticket.ResetSla();
        }

        await _ticketRepository.UpdateAsync(ticket);
        return ToDto(ticket);
    }

    public async Task<TicketDto> ResolveAsync(Guid id)
    {
        var ticket = await _ticketRepository.GetAsync(id);
        var currentAgentId = CurrentUser.GetId();
        ticket.Resolve(currentAgentId);
        await _ticketRepository.UpdateAsync(ticket);
        return ToDto(ticket);
    }

    public async Task<TicketDto> ReopenAsync(Guid id, ReopenTicketDto input)
    {
    
        var ticket = await _ticketRepository.GetAsync(id);
        var currentUserId = CurrentUser.GetId();
        ticket.Reopen(currentUserId, input.Reason);
        await _ticketRepository.UpdateAsync(ticket);
        return ToDto(ticket);
    }

    public async Task<TicketDto> CloseAsync(Guid id)
    {
        var ticket = await _ticketRepository.GetAsync(id);
        var currentUserId = CurrentUser.GetId();
        ticket.Close(currentUserId);
        await _ticketRepository.UpdateAsync(ticket);
        return ToDto(ticket);
    }

    public async Task<TicketDto> ChangePriorityAsync(Guid id, ChangeTicketPriorityDto input)
    {
        var ticket = await _ticketRepository.GetAsync(id);
        var currentUserId = CurrentUser.GetId();
        ticket.ChangePriority(currentUserId, ToTicketPriority(input.Priority));
        await _ticketRepository.UpdateAsync(ticket);
        return ToDto(ticket);
    }
    public async Task<TicketDto> AddCommentAsync(Guid id, AddTicketCommentDto input)
    {
        var ticket = await _ticketRepository.GetAsync(id);
        var currentUserId = CurrentUser.GetId();
        ticket.AddComment(currentUserId, input.Text);
        await _ticketRepository.UpdateAsync(ticket);
        return ToDto(ticket);
    }

    public async Task<ListResultDto<TicketDto>> GetOverdueTicketsAsync()
    {
        var queryable = await _ticketRepository.GetQueryableAsync();

        var now = DateTime.UtcNow;

        var overdueTickets = queryable
            .Where(t => t.SlaDeadline < now)
            .Where(t => t.Status != TicketStatus.Resolved && t.Status != TicketStatus.Closed)
            .OrderBy(t => t.SlaDeadline)
            .ToList();

        return new ListResultDto<TicketDto>(overdueTickets.Select(ToDto).ToList());
    }

    private static TicketDto ToDto(Ticket ticket) => new()
    {
        Id = ticket.Id,
        Title = ticket.Title,
        Description = ticket.Description,
        Status = ticket.Status,
        Priority = ticket.Priority.Level,
        AssignedAgentId = ticket.AssignedAgentId,
        SlaDeadline = ticket.SlaDeadline,
        Comments = ticket.Comments
         .OrderBy(c => c.CreationTime)
         .Select(c => new TicketCommentDto
         {
             Id = c.Id,
             AuthorId = c.AuthorId,
             Text = c.Text,
             CreationTime = c.CreationTime
         })
         .ToList()
    };

    private static TicketPriority ToTicketPriority(PriorityLevel level) => level switch
    {
        PriorityLevel.Low => TicketPriority.Low,
        PriorityLevel.Medium => TicketPriority.Medium,
        PriorityLevel.High => TicketPriority.High,
        PriorityLevel.Critical => TicketPriority.Critical,
        _ => throw new BusinessException(SupportTicketSystemDomainErrorCodes.InvalidPriorityLevel)
    };
}