# syntax=docker/dockerfile:1

# FROM node:22-slim AS base
# ENV PNPM_HOME="/pnpm"
# ENV CI="true"
# ENV PATH="$PNPM_HOME:$PATH"
# RUN corepack enable
# COPY . /app
# WORKDIR /app

# FROM base AS deps
# RUN pnpm install --prod --frozen-lockfile

# FROM base AS builder
# ARG NEXT_PUBLIC_API_BASE_URL
# ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
# ARG NEXT_PUBLIC_BASE_URL
# ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
# ARG NEXT_PUBLIC_STORAGE_URL
# ENV NEXT_PUBLIC_STORAGE_URL=${NEXT_PUBLIC_STORAGE_URL}

# RUN pnpm install --frozen-lockfile
# RUN pnpm run build

# FROM base AS runner
# COPY --from=deps /app/node_modules /app/node_modules
# COPY --from=builder /app/.next /app/.next
# EXPOSE 3000
# CMD [ "pnpm", "start" ]

FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS prod
COPY pnpm-lock.yaml /app/
WORKDIR /app
RUN pnpm fetch --prod

COPY . /app
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ARG NEXT_PUBLIC_STORAGE_URL
ENV NEXT_PUBLIC_STORAGE_URL=${NEXT_PUBLIC_STORAGE_URL}
RUN pnpm run build

FROM base
COPY --from=prod /app/node_modules /app/node_modules
COPY --from=prod /app/dist /app/dist
EXPOSE 3000
CMD [ "pnpm", "start" ]
