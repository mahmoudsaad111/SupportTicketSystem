using SupportTicketSystem.Samples;
using Xunit;

namespace SupportTicketSystem.EntityFrameworkCore.Domains;

[Collection(SupportTicketSystemTestConsts.CollectionDefinitionName)]
public class EfCoreSampleDomainTests : SampleDomainTests<SupportTicketSystemEntityFrameworkCoreTestModule>
{

}
