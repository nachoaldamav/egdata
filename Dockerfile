FROM node:22-alpine AS base
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

FROM oven/bun:1.2.17-debian
WORKDIR /app
RUN apt update && apt install -y ca-certificates wget && update-ca-certificates
COPY --from=build /app/.output /app/.output
EXPOSE 3000
CMD [ "bun", "run", ".output/server/index.mjs" ]