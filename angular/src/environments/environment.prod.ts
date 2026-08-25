import { Environment } from '@abp/ng.core';

// This file is used by `ng build --configuration production` -- which is
// what angular/Dockerfile runs for docker-compose's local frontend
// container. baseUrl/redirectUri must be the FRONTEND's own address (where
// the browser actually loads the app from, per docker-compose's "4200:4200"
// port mapping) -- NOT the backend's address. Only the OAuth issuer and API
// url point at the backend container's exposed port. Getting baseUrl wrong
// here causes OpenIddict to reject login with a 400: the redirect_uri sent
// during the OAuth flow won't match what's registered for the client.
const baseUrl = 'http://localhost:4200';

export const environment = {
  production: true,
  application: {
    baseUrl,
    name: 'SupportTicketSystem',
    logoUrl: '/assets/images/logo/support-ticket-logo.svg',
  },
  oAuthConfig: {
    issuer: 'https://localhost:44376/',
    redirectUri: baseUrl,
    clientId: 'SupportTicketSystem_App',
    responseType: 'code',
    scope: 'offline_access SupportTicketSystem',
    requireHttps: true,
  },
  apis: {
    default: {
      url: 'https://localhost:44376',
      rootNamespace: 'SupportTicketSystem',
    },
  },
} as Environment;
