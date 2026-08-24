using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SupportTicketSystem.Domain.Tickets;
using Volo.Abp.EntityFrameworkCore.Modeling;

namespace SupportTicketSystem.EntityFrameworkCore.Configurations;

internal class TicketStatusChangeConfiguration : IEntityTypeConfiguration<TicketStatusChange>
{
    public void Configure(EntityTypeBuilder<TicketStatusChange> b)
    {
        b.ToTable(SupportTicketSystemConsts.DbTablePrefix + "TicketStatusChanges", SupportTicketSystemConsts.DbSchema);
        b.ConfigureByConvention();
    }
}