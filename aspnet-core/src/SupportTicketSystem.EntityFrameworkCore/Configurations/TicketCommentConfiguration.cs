using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SupportTicketSystem.Domain.Tickets;
using Volo.Abp.EntityFrameworkCore.Modeling;

namespace SupportTicketSystem.EntityFrameworkCore.Configurations;

internal class TicketCommentConfiguration : IEntityTypeConfiguration<TicketComment>
{
    public void Configure(EntityTypeBuilder<TicketComment> b)
    {
        b.ToTable(SupportTicketSystemConsts.DbTablePrefix + "TicketComments", SupportTicketSystemConsts.DbSchema);
        b.ConfigureByConvention();
        b.Property(c => c.Text).IsRequired();
    }
}