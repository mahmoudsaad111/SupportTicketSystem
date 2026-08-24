using System.Threading.Tasks;

namespace SupportTicketSystem.Data;

public interface ISupportTicketSystemDbSchemaMigrator
{
    Task MigrateAsync();
}
