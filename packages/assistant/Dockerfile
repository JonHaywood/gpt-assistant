# Build context is the root of the project

# Base image with necessary dependencies
FROM jonhaywood/raspberrypi4-assistant:latest AS base

# Install Node.js dependencies in a separate stage for caching
FROM base AS jsdeps

WORKDIR /app

# Copy package.json and package-lock.json first
COPY ./packages/assistant/package*.json ./packages/assistant/
COPY ./packages/shared/package*.json ./packages/shared/
COPY ./package*.json ./

# Install dependencies
RUN npm install

# Stage for building the application
# Because jsdeps is in a different stage, don't have to install
# node_modules each time we build the image
FROM base AS builder

WORKDIR /app

# Copy node_modules from the jsdeps stage
COPY --from=jsdeps ./node_modules ./node_modules
COPY --from=jsdeps ./packages/assistant/node_modules ./packages/assistant/node_modules

# Copy the rest of the application files
COPY ./packages/assistant ./packages/assistant/
COPY ./packages/shared ./packages/shared/

# Build the application
RUN npm run build

# Install Python dependencies
# TODO: fix bundling by tsup so jsdeps isn't needed to run the app
#FROM base AS pythondeps
FROM jsdeps AS pythondeps

WORKDIR /app

# Setup python virtual environment (to allow for pip installs)
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Copy requirements.txt
COPY requirements.txt ./packages/assistant/

# Install Python dependencies from requirements.txt
RUN pip install -r requirements.txt

# Stage for running the application
FROM pythondeps AS runner

WORKDIR /app

# Tell the app it's running in proaduction
ENV NODE_ENV=production

# Copy the dist directory
COPY --from=builder /app/packages/assistant/dist ./packages/assistant/dist

# Copy static files from the builder stage
COPY --from=builder /app/packages/assistant/assets ./packages/assistant/assets