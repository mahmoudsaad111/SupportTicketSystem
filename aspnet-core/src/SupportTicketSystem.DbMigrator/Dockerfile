# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY . .

RUN dotnet restore "src/SupportTicketSystem.DbMigrator/SupportTicketSystem.DbMigrator.csproj"
RUN dotnet publish "src/SupportTicketSystem.DbMigrator/SupportTicketSystem.DbMigrator.csproj" \
    -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# DbMigrator is a run-once console app (applies EF Core migrations, then
# runs every IDataSeedContributor — including the ticket seed data — then
# exits). It's meant to run to completion, not stay alive, so this image
# has no long-running process and no exposed ports.
ENTRYPOINT ["dotnet", "SupportTicketSystem.DbMigrator.dll"]
