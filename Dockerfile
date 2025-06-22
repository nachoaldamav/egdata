FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

RUN apk add --no-cache wget curl
RUN apk add --no-cache --virtual .build-deps gcc g++ make python3

FROM base AS deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules /app/node_modules
RUN pnpm run build
RUN apk del .build-deps

FROM base
COPY --from=build /app/.output /app/.output
EXPOSE 3000