FROM node:18-slim

WORKDIR /app

# Copy package.json and package-lock.json first
COPY package.json package-lock.json /app/

# Install dependencies (skip security audit)
RUN npm install --no-audit

# Copy the rest of the application files
COPY . /app

# Expose the port the app runs on
EXPOSE 3000

# Build the application
# RUN npm run build