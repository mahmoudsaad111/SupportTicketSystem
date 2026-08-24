using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SupportTicketSystem.Domain.Shared.Tickets;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;

namespace SupportTicketSystem.Domain.Tickets;


public class TicketDataSeedContributor : IDataSeedContributor, ITransientDependency
{
    private readonly IRepository<Ticket, Guid> _ticketRepository;
    private readonly IIdentityUserRepository _identityUserRepository;

    public TicketDataSeedContributor(
        IRepository<Ticket, Guid> ticketRepository,
        IIdentityUserRepository identityUserRepository)
    {
        _ticketRepository = ticketRepository;
        _identityUserRepository = identityUserRepository;
    }

    public async Task SeedAsync(DataSeedContext context)
    {
        if (await _ticketRepository.GetCountAsync() > 0)
        {
            // Already seeded (or real data exists) — don't duplicate.
            return;
        }

        var agentIds = await GetAgentIdsAsync();
        var customerIds = Enumerable.Range(0, 6).Select(_ => Guid.NewGuid()).ToArray();

        var now = DateTime.UtcNow;
        var agentIndex = 0;
        Guid NextAgent() => agentIds[agentIndex++ % agentIds.Length];

        var seedIndex = 0;

        foreach (var seed in GetSeedDefinitions())
        {
            var ticket = Ticket.Create(
                id: Guid.NewGuid(),
                tenantId: context.TenantId,
                title: seed.Title,
                description: seed.Description,
                priority: ToPriority(seed.Priority));

            ticket.CreatorId = customerIds[seedIndex % customerIds.Length];
            seedIndex++;

            if (seed.State == SeedState.Open)
            {
                await _ticketRepository.InsertAsync(ticket);
                continue;
            }

            var agentId = NextAgent();
            ticket.AssignTo(agentId, agentId);

            if (seed.Overdue)
            {
                // Backdate the audit CreationTime, then re-run ChangePriority
                // (even to the same priority) so SlaDeadline gets recomputed
                // from the backdated CreationTime via the aggregate's own
                // logic — the ticket ends up genuinely, honestly overdue,
                // not just cosmetically flagged.
                ticket.CreationTime = now.AddDays(-9);
                ticket.ChangePriority(agentId, ToPriority(seed.Priority));
            }

            if (seed.Comment != null)
            {
                ticket.AddComment(agentId, seed.Comment);
            }

            if (seed.State == SeedState.InProgress)
            {
                await _ticketRepository.InsertAsync(ticket);
                continue;
            }

            ticket.Resolve(agentId);

            if (seed.SecondComment != null)
            {
                ticket.AddComment(agentId, seed.SecondComment);
            }

            if (seed.State == SeedState.Resolved)
            {
                await _ticketRepository.InsertAsync(ticket);
                continue;
            }

            if (seed.State == SeedState.Reopened)
            {
                ticket.Reopen(agentId, seed.ReopenReason ?? "Issue recurred after initial fix.");
                await _ticketRepository.InsertAsync(ticket);
                continue;
            }

            // Closed
            ticket.Close(agentId);
            await _ticketRepository.InsertAsync(ticket);
        }
    }

    private async Task<Guid[]> GetAgentIdsAsync()
    {
        var users = await _identityUserRepository.GetListAsync();
        var ids = users.Select(u => u.Id).Take(5).ToArray();

        // Fallback in the unlikely case no identity users exist yet —
        // still produces valid, internally-consistent Guids so every
        // AssignTo/Resolve/Reopen/Close invariant is satisfied.
        return ids.Length > 0 ? ids : new[] { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() };
    }

    private static TicketPriority ToPriority(PriorityLevel level) => level switch
    {
        PriorityLevel.Low => TicketPriority.Low,
        PriorityLevel.Medium => TicketPriority.Medium,
        PriorityLevel.High => TicketPriority.High,
        PriorityLevel.Critical => TicketPriority.Critical,
        _ => TicketPriority.Medium,
    };

    private enum SeedState
    {
        Open,
        InProgress,
        Resolved,
        Reopened,
        Closed,
    }

    private sealed record TicketSeed(
        string Title,
        string Description,
        PriorityLevel Priority,
        SeedState State,
        bool Overdue = false,
        string? Comment = null,
        string? SecondComment = null,
        string? ReopenReason = null);

    private static IEnumerable<TicketSeed> GetSeedDefinitions() => new[]
    {
        // Open / unassigned (5)
        new TicketSeed(
            "Feature request: dark mode for dashboard",
            "Several users have asked for a dark mode option in the main dashboard to reduce eye strain during night shifts.",
            PriorityLevel.Low, SeedState.Open),

        new TicketSeed(
            "Cannot export ticket list to CSV",
            "Clicking 'Export' on the All Tickets page does nothing — no download starts and no error is shown.",
            PriorityLevel.Medium, SeedState.Open),

        new TicketSeed(
            "Login page returns 500 on Safari",
            "Multiple users on macOS Safari report a server error immediately after submitting the login form. Works fine on Chrome.",
            PriorityLevel.High, SeedState.Open),

        new TicketSeed(
            "Production API returning 503 intermittently",
            "Around 1 in 20 requests to the public API are failing with 503 Service Unavailable during peak hours.",
            PriorityLevel.Critical, SeedState.Open),

        new TicketSeed(
            "Notification bell badge count is wrong",
            "The unread notification badge shows 3 even after marking all notifications as read and refreshing.",
            PriorityLevel.Medium, SeedState.Open),

        // In progress, not overdue (3)
        new TicketSeed(
            "Typo in email confirmation template",
            "The password-reset confirmation email says 'Your requst has been recieved' — two typos in the same sentence.",
            PriorityLevel.Low, SeedState.InProgress,
            Comment: "Found the template file, fix is trivial — will ship with the next deploy."),

        new TicketSeed(
            "Slack integration webhook not firing",
            "New ticket notifications configured to post to Slack stopped arriving three days ago. No errors in the webhook logs panel.",
            PriorityLevel.Medium, SeedState.InProgress,
            Comment: "Checking whether the webhook URL secret expired on Slack's side."),

        new TicketSeed(
            "File upload fails for attachments over 5MB",
            "Users attaching screenshots or logs larger than 5MB get a generic 'Upload failed' message with no details.",
            PriorityLevel.High, SeedState.InProgress,
            Comment: "Reproduced locally — looks like a request body size limit in Kestrel config."),

        // In progress, overdue (3)
        new TicketSeed(
            "Payment gateway timeout on checkout",
            "Customers report the checkout page hangs on 'Processing payment...' and eventually times out, no charge goes through.",
            PriorityLevel.Critical, SeedState.InProgress, Overdue: true,
            Comment: "Escalated to the payments provider — awaiting their incident update."),

        new TicketSeed(
            "Customers report duplicate charges",
            "Three customers this week were charged twice for the same order. Refunds issued manually so far.",
            PriorityLevel.High, SeedState.InProgress, Overdue: true,
            Comment: "Suspect a retry-without-idempotency-key bug in the billing service."),

        new TicketSeed(
            "Entire tenant locked out after tenant switch bug",
            "One customer org reports every user got signed out simultaneously and can't log back in since switching subscription plans.",
            PriorityLevel.Critical, SeedState.InProgress, Overdue: true,
            Comment: "This is affecting a paying customer's whole team — treating as top priority."),

        // Resolved (4)
        new TicketSeed(
            "How do I reset my password?",
            "I don't see a 'forgot password' link anywhere on the login screen.",
            PriorityLevel.Low, SeedState.Resolved,
            Comment: "The link is there, but it's easy to miss — it's below the fold on smaller screens.",
            SecondComment: "Added a note to the design backlog to make it more visible. Marking resolved for now."),

        new TicketSeed(
            "Dashboard chart not loading in Firefox",
            "The 'Tickets by Priority' donut chart on the dashboard stays blank in Firefox, works fine in Chrome/Edge.",
            PriorityLevel.Medium, SeedState.Resolved,
            Comment: "Firefox was blocking a font file due to a CORS header — fixed in the CDN config."),

        new TicketSeed(
            "SLA breach notification email not sent",
            "An SLA was breached yesterday but no email alert went out to the assigned agent.",
            PriorityLevel.High, SeedState.Resolved,
            Comment: "Email templates were pointing at a decommissioned SMTP relay — updated to the new one."),

        new TicketSeed(
            "Search returns no results for exact ticket ID",
            "Searching for a ticket by its exact ID sometimes returns nothing, even though the ticket definitely exists.",
            PriorityLevel.Medium, SeedState.Resolved,
            Comment: "The search index was excluding tickets older than 30 days by mistake — reindexed everything."),

        // Reopened (2)
        new TicketSeed(
            "Mobile app crashes on ticket detail screen",
            "Opening any ticket's detail view in the iOS app crashes back to the home screen.",
            PriorityLevel.High, SeedState.Reopened,
            Comment: "Traced to a null comment author causing a force-unwrap crash — patched and shipped.",
            SecondComment: "Reopening — still crashing for tickets with zero comments specifically, the earlier fix only covered the null-author case.",
            ReopenReason: "Crash still occurs for tickets that have no comments at all."),

        new TicketSeed(
            "Exported PDF missing ticket comments",
            "PDF export of a ticket only includes the title/description, comments are silently dropped.",
            PriorityLevel.Medium, SeedState.Reopened,
            Comment: "Added comments to the PDF template.",
            SecondComment: "Reopening — comments show up now but are out of chronological order.",
            ReopenReason: "Comments appear in the exported PDF but are not sorted correctly."),

        // Closed (3)
        new TicketSeed(
            "Add support for dark mode toggle",
            "Following up on earlier requests — please add an actual dark mode toggle in Settings.",
            PriorityLevel.Low, SeedState.Closed,
            Comment: "Shipped behind a 'Appearance' section in Settings."),

        new TicketSeed(
            "Integrate with Microsoft Teams",
            "We use Teams internally and would like ticket notifications posted there instead of Slack.",
            PriorityLevel.Medium, SeedState.Closed,
            Comment: "Added a Teams webhook option alongside the existing Slack one."),

        new TicketSeed(
            "Two-factor authentication setup fails",
            "Scanning the QR code during 2FA setup gives an 'invalid code' error every time, even with a fresh scan.",
            PriorityLevel.High, SeedState.Closed,
            Comment: "Server clock had drifted by several minutes, invalidating TOTP codes — resynced via NTP."),
    };
}
