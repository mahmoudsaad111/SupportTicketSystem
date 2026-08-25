# 🎫 SupportTicketSystem

[![Build and Deploy](https://github.com/mahmoudsaad111/SupportTicketSystem/actions/workflows/deploy.yml/badge.svg)](https://github.com/mahmoudsaad111/SupportTicketSystem/actions/workflows/deploy.yml)
[![.NET 10](https://img.shields.io/badge/.NET-10-512BD4)](https://dotnet.microsoft.com/)
[![Angular](https://img.shields.io/badge/Angular-DD0031)](https://angular.dev/)

A full-stack support ticket / helpdesk platform, built as a small, focused project to practice Domain-Driven Design and the ABP Framework — with ABP (.NET) on the backend and Angular on the frontend, deployed and running live.

**🔗 Live demo:** [supportticketsystem.runasp.net](http://supportticketsystem.runasp.net/)

---

## Why this project exists

This started as a hands-on way to practice Domain-Driven Design and the ABP Framework specifically — not just another CRUD demo. Most "CRUD ticket system" tutorials are exactly that: a `Ticket` table with an `Update` endpoint that lets you change anything to anything. This one deliberately isn't that.

The goal here was to build something that actually behaves like a real support system: a ticket can't be resolved before it's assigned, only the agent it's assigned to can close it, priority changes recompute the SLA deadline instead of leaving it stale, and every state change is a named, deliberate action — `AssignTo`, `Resolve`, `Reopen`, `Close` — not a generic `Update`. That's a small design choice with a big consequence: the business rules live in one place (the domain model), not scattered across controllers, and they can't be silently bypassed.

## What it does

- **Full ticket lifecycle** — Open → In Progress → Resolved → Reopened → Closed, each transition enforcing its own rules (can't resolve an unassigned ticket, can't comment on a closed one, only the assigned agent can hand it off)
- **SLA tracking** — priority determines a real deadline (Critical = 4h, Low = 7 days), and a background worker sweeps for breaches and raises a domain event when one happens
- **Role-based access** — Agent / Admin permissions gate the actions that matter (assign, resolve, close), while viewing and commenting stay open to any authenticated user
- **Dashboards & views** — All Tickets, My Tickets, Unassigned (with one-click claim), Overdue, plus a live notification bell with an unread-count badge
- **CSV export**, comment threads, multi-tenancy support baked in via ABP
- **20 seeded demo tickets** across every status/priority combination so the app has real data to look at on first run, no manual data entry required

## Screenshots

<!-- Sourced from /screenshots — rename the files or swap the paths below if you reorder them. -->

| | |
|---|---|
| ![Screenshot 1](screenshots/Screenshot%202026-08-23%20164353.png) | ![Screenshot 2](screenshots/Screenshot%202026-08-25%20145107.png) |
| ![Screenshot 3](screenshots/Screenshot%202026-08-25%20145124.png) | ![Screenshot 4](screenshots/Screenshot%202026-08-25%20145140.png) |

## The architecture, briefly

```
Ticket (Aggregate Root)
 ├── TicketComment (child entity)
 ├── TicketStatusChange (child entity — full audit trail)
 ├── TicketPriority (Value Object — owns the SLA-deadline math)
 └── Domain Events → TicketAssignedEvent, TicketResolvedEvent, TicketSlaBreachedEvent...
```

Backend: **ASP.NET Core (.NET 10) + ABP Framework**, Clean Architecture layering (Domain → Application → HttpApi.Host), EF Core + SQL Server, OpenIddict for auth. Frontend: **Angular**, ABP's LeptonX theme, served from the same host as the API in production. CI/CD via **GitHub Actions**, deploying automatically via Web Deploy.

The one deliberate constraint throughout: there's no generic `UpdateTicketCommand`. Every write is a named, intention-revealing method that maps to something a real support agent actually does.

## Running it locally

**Fastest path — Docker:**
```bash
docker compose up --build
```
This spins up SQL Server, runs migrations + seeds the 20 demo tickets, and starts both the API and frontend. See `docker-compose.yml` and `.env` for the handful of values you'll want to set (SQL password, HTTPS dev cert path).

**Manual path:**
1. `aspnet-core/src/SupportTicketSystem.DbMigrator` → run once (creates the DB, seeds an admin user, permissions, and demo tickets)
2. `aspnet-core/src/SupportTicketSystem.HttpApi.Host` → run the API
3. `angular` → `yarn install && yarn start`

## Deployment

Every push to `main` runs a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds both projects, copies the Angular output into the backend's `wwwroot`, and publishes the whole thing as a single site via Web Deploy — currently hosted on MonsterASP.NET.

## What I'd build next

Being honest about scope, since a small, focused project is necessarily a snapshot, not a finished product:
- Real-time SLA breach notifications (currently logged server-side; a natural next step is pushing them to the UI live via SignalR)
- A dedicated `ITicketRepository` for the handful of queries currently duplicated between the app service and the background worker
- Broader automated test coverage on the aggregate's invariants (the domain is written to be trivially testable — testing just hasn't been the focus yet)

## Tech stack

`.NET 10` · `ABP Framework` · `Entity Framework Core` · `SQL Server` · `OpenIddict` · `Angular` · `TypeScript` · `Docker` · `GitHub Actions`

---

Built solo, end-to-end — domain modeling, API, frontend, containerization, and CI/CD.
