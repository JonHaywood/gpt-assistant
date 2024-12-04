# GPT Assistant

GPT-Assistant your own personal Siri, your own "OK Google", a Typescript, Node.js-based digital home assistant built to run on a Raspberry Pi.

> :warning: This project is very much in an alpha, WIP state. The current codebase may be broken at any point. Hopefully a stable release is just around the corner!

## Features

- **Wake Word Detection**: Uses Porcupine to detect a custom wake word.
- **Speech-to-Text (STT)**: Integrates OpenAI Whisper for audio transcription.
- **Text-to-Speech (TTS)**: Uses Piper for high-quality, efficient TTS generation.
- **Interruptible Dialogues**: Allows stopping and restarting TTS playback for dynamic conversation handling.
- **Contextual AI Responses**: Tracks recent questions and answers for contextual interactions using OpenAI's API.
- **Tools**: Supports function calling or "tools" to provide additional abilities not inherent to the AI.

## Architecture

The project is built to run on a Raspberry Pi 4 and as such, does as much on-device processing as possible to lower latency.

The general flow is this:
* The Pi has a microphone and the Assistant continuously processes input.
* No logic is executed until the wake word is detected.
* When it is, the Assistant listens for the request.
* The command converted to text via STT transcription.
* The request is run through an LLM with the appropriate context.
* The response is converted to audio via TTS.
* The audio plays over the Pi's speakers.

### Services

There are to main services to enable this:
* Assistant - the assistant itself.
* Web App - used to easily administer the assistant

### Execution

The app is designed to run in a docker container. The idea behind this is that it should be easy to spin up an instance of the app, complete with required dependencies and such.s

The assistant and web app run in separate containers and can be started and stopped independently.

## More Stuff

More details coming soon!