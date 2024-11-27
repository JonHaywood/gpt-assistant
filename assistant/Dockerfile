# Base image with necessary dependencies
FROM jonhaywood/raspberrypi4-assistant:latest AS base

# Install Node.js dependencies in a separate stage for caching
FROM base AS jsdeps

WORKDIR /app

# Copy package.json and package-lock.json first
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --force

# Stage for building the application
# Because jsdeps is in a different stage, don't have to install
# node_modules each time we build the image
FROM base AS builder

WORKDIR /app

# Copy nodd_modules from the jsdeps stage
COPY --from=jsdeps /app/node_modules ./node_modules

# Copy the rest of the application files
COPY . .

# Build the application
RUN npm run build

# Install Python dependencies
FROM jsdeps AS shareddeps

WORKDIR /app

# Setup python virtual environment (to allow for pip installs)
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Copy requirements.txt
COPY requirements.txt .

# Install Python dependencies from requirements.txt
RUN pip install -r requirements.txt

# Stage for running the application
FROM shareddeps AS runner

WORKDIR /app

# Tell the app it's running in proaduction
ENV NODE_ENV=production

# Copy the dist directory
COPY --from=builder /app/dist ./dist

# Copy static files from the builder stage
COPY --from=builder /app/assets ./assets