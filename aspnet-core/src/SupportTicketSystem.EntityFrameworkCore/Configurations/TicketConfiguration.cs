using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SupportTicketSystem.Domain.Tickets;
using System;
using Volo.Abp.EntityFrameworkCore.Modeling;

namespace SupportTicketSystem.EntityFrameworkCore.Configurations;

internal class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
    public void Configure(EntityTypeBuilder<Ticket> b)
    {
        b.ToTable(SupportTicketSystemConsts.DbTablePrefix + "Tickets", SupportTicketSystemConsts.DbSchema);
        b.ConfigureByConvention();

        b.Property(t => t.Title).HasMaxLength(150).IsRequired();
        b.Property(t => t.Description).IsRequired();

        b.OwnsOne(t => t.Priority, p =>
        {
            p.Property(x => x.Level).HasColumnName("PriorityLevel");

            p.Property(x => x.SlaWindow)
                .HasColumnName("PrioritySlaWindow")
                .HasConversion(
                    v => v.Ticks,
                    v => TimeSpan.FromTicks(v))
                .HasColumnType("bigint");
        });

        b.HasMany(t => t.Comments)
            .WithOne()
            .HasForeignKey(c => c.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasMany(t => t.StatusHistory)
            .WithOne()
            .HasForeignKey(sc => sc.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        // AutoInclude the Comments navigation property to always load comments when querying tickets
        b.Navigation(t => t.Comments).AutoInclude();

    }
}