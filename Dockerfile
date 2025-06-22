FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS deps
RUN apk add --no-cache --virtual .build-deps gcc g++ make python3
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS build
RUN pnpm run build
RUN apk del .build-deps

FROM base as final
RUN apk add --no-cache wget curl
COPY --from=build /app/.output /app/.output
EXPOSE 3000