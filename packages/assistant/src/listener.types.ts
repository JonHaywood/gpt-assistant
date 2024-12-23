/**
 * Represents the audio buffer, since existing Buffer class is only 8bit.
 */
export interface AudioBuffer extends Int16Array {}

/**
 * Callback function to process each chunk of audio data.
 */
export interface ListenerDataCallback {
  (data: AudioBuffer): void;
}
