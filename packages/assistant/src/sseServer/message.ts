export enum SseEvent {
  SPEAKING = 'speaking',
}

export interface SseMessage {
  data: unknown;
  event: SseEvent;
  id?: string;
}

export function serializeSseMessage(message: SseMessage): string {
  const data =
    typeof message.data === 'string'
      ? message.data
      : JSON.stringify(message.data);
  const id = message.id ? `id: ${message.id}\n` : '';
  return `${id}event: ${message.event}\ndata: ${data}\n\n`;
}
