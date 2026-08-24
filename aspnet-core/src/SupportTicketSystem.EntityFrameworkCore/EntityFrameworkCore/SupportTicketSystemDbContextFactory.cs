using System;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace SupportTicketSystem.EntityFrameworkCore;

/* This class is needed for EF Core console commands
 * (like Add-Migration and Update-Database commands) */
public class SupportTicketSystemDbContextFactory : IDesignTimeDbContextFactory<SupportTicketSystemDbContext>
{
    public SupportTicketSystemDbContext CreateDbContext(string[] args)
    {
        SupportTicketSystemEfCoreEntityExtensionMappings.Configure();

        var configuration = BuildConfiguration();

        var builder = new DbContextOptionsBuilder<SupportTicketSystemDbContext>()
            .UseSqlServer(configuration.GetConnectionString("Default"));

        return new SupportTicketSystemDbContext(builder.Options);
    }

    private static IConfigurationRoot BuildConfiguration()
    {
        var builder = new ConfigurationBuilder()
            .SetBasePath(Path.Combine(Directory.GetCurrentDirectory(), "../SupportTicketSystem.DbMigrator/"))
            .AddJsonFile("appsettings.json", optional: false);

        return builder.Build();
    }
}
