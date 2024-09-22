FROM ubuntu:23.04

# Set non-interactive installation to avoid tzdata prompt
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates software-properties-common wget tar

# Install ARMhf base libraries
RUN dpkg --add-architecture armhf

# Install necessary packages
RUN /bin/bash -c "yes | add-apt-repository universe && \
    dpkg --add-architecture armhf && apt-get update && \
    apt-get install -y --no-install-recommends supervisor nano neovim \
    avahi-daemon avahi-utils libnss-mdns dbus iputils-ping \
    build-essential curl git libssl-dev zlib1g-dev libbz2-dev libreadline-dev \
    libsqlite3-dev llvm libncursesw5-dev xz-utils tk-dev libraspberrypi-bin \
    libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev libjpeg-dev \
    portaudio19-dev alsa-utils libasound2-dev i2c-tools python3 python3-pip python3-venv \
    jackd2 libogg0 libflac-dev flac libespeak1 cmake openssl expect \
    nodejs npm libc6:armhf libdbus-1-3:armhf libasound2:armhf && rm -rf /var/lib/apt/lists/*"

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install dependencies using pnpm
RUN npm install --force

# Create a python virtual environment (to allow for pip installs)
RUN python -m venv .venv

# Activate the virtual environment
RUN source .venv/bin/activate

# Install Piper TTS in the virtual environment
RUN pip install piper-tts

# Run any necessary commands on container startup (optional)
# The CMD is not necessary if you are specifying the command in docker-compose.yml
#CMD ["poetry", "run", "python"]