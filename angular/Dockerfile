# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build --configuration production

FROM nginx:alpine AS runtime

# The @angular/build application builder outputs to dist/<project>/browser
# (confirmed against this repo's actual dist/ folder) — not directly under
# dist/<project> like the older builder used to.
COPY --from=build /app/dist/SupportTicketSystem/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4200
