# base image with the necessary dependencies
FROM jonhaywood/raspberrypi4-assistant:latest

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json /app

# Install dependencies using pnpm
RUN npm install --force

# Copy the rest of the application files
COPY . /app

# Create a python virtual environment (to allow for pip installs)
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python dependencies from requirements.txt
RUN pip install -r requirements.txt
