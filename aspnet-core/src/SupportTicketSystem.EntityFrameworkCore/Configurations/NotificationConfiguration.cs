using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SupportTicketSystem.Domain.Notifications;
using Volo.Abp.EntityFrameworkCore.Modeling;

namespace SupportTicketSystem.EntityFrameworkCore.Configurations;

internal class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> b)
    {
        b.ToTable(SupportTicketSystemConsts.DbTablePrefix + "Notifications", SupportTicketSystemConsts.DbSchema);
        b.ConfigureByConvention();

        b.Property(n => n.Title).HasMaxLength(150).IsRequired();
        b.Property(n => n.Message).IsRequired();

        b.HasIndex(n => new { n.UserId, n.IsRead });
    }
}