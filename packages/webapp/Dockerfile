FROM node:20-alpine AS base

# Stage for installing system dependencies
FROM base AS system

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
# to understand why libc6-compat might be needed. Docker CLI allows docker commands to run
# from within the container
RUN apk update && apk add --no-cache libc6-compat docker-cli

# Stage for installing dependencies, if package.json and package-lock.json
# don't change, docker will skip this stage
FROM base AS deps

WORKDIR /app

# Copy package.json and package-lock.json first
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Stage for building the application
# Because deps is in a different stage, don't have to install
# node_modules each time we build the image
FROM base AS builder

WORKDIR /app

# Copy nodd_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of the application files
COPY . .

# Accept the SSE port build argument
ARG NEXT_PUBLIC_ASSISTANT_SSE_PORT

# Since this is a client-side environment variable, need to set it before building
# so it is bundled into the final build
ENV NEXT_PUBLIC_ASSISTANT_SSE_PORT=$NEXT_PUBLIC_ASSISTANT_SSE_PORT

# Build the application
RUN npm run build

# Stage for running the application
FROM system AS runner

WORKDIR /app

# Tell the app it's running in production
ENV NODE_ENV=production

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the public directory
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/.next/standalone ./

# Copy static files from the builder stage
COPY --from=builder /app/.next/static ./.next/static

# Expose the port the app runs on
EXPOSE 3000

# Set the port environment variable for next to use
ENV PORT=3000

# Ensures that the application is accessible outside of the container
ENV HOSTNAME="0.0.0.0"
