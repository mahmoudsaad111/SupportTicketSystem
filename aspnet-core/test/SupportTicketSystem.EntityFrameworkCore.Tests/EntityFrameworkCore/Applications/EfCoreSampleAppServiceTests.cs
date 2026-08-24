using SupportTicketSystem.Samples;
using Xunit;

namespace SupportTicketSystem.EntityFrameworkCore.Applications;

[Collection(SupportTicketSystemTestConsts.CollectionDefinitionName)]
public class EfCoreSampleAppServiceTests : SampleAppServiceTests<SupportTicketSystemEntityFrameworkCoreTestModule>
{

}
