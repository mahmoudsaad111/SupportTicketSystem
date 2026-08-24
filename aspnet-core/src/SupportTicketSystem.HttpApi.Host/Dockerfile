# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy the whole aspnet-core folder (this is the Docker build context) so
# project references, common.props, and NuGet.Config all resolve exactly
# the same way they do when building locally in Visual Studio.
COPY . .

RUN dotnet restore "src/SupportTicketSystem.HttpApi.Host/SupportTicketSystem.HttpApi.Host.csproj"
RUN dotnet publish "src/SupportTicketSystem.HttpApi.Host/SupportTicketSystem.HttpApi.Host.csproj" \
    -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# 44376 (HTTPS) matches the port already hardcoded into the Angular app's
# environment.prod.ts (AuthServer authority + API url), so the frontend
# needs zero changes to keep talking to this container. 8080 is a plain
# HTTP fallback, exposed but not required by the existing frontend config.
ENV ASPNETCORE_URLS=https://+:44376;http://+:8080
EXPOSE 44376
EXPOSE 8080

ENTRYPOINT ["dotnet", "SupportTicketSystem.HttpApi.Host.dll"]
