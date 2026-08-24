using System;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace SupportTicketSystem.Tickets;

public interface ITicketAppService : IApplicationService
{
    Task<TicketDto> CreateAsync(CreateTicketDto input);
    Task<TicketDto> GetAsync(Guid id);
    Task<TicketDto> AssignAsync(Guid id, AssignTicketDto input);
    Task<TicketDto> ResolveAsync(Guid id);
    Task<TicketDto> ReopenAsync(Guid id, ReopenTicketDto input);
    Task<TicketDto> CloseAsync(Guid id);
    Task<TicketDto> ChangePriorityAsync(Guid id, ChangeTicketPriorityDto input);
    Task<TicketDto> AddCommentAsync(Guid id, AddTicketCommentDto input);
    Task<PagedResultDto<TicketDto>> GetListAsync(GetTicketListDto input);

    Task<ListResultDto<TicketDto>> GetOverdueTicketsAsync();
}