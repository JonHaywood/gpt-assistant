import { useEffect, useState } from "react";

export const EVENTSOURCE_RECONNECT_TIMEOUT = 30000;

export enum EventSourceMessageType {
  Connecting = "connecting",
  Connected = "connected",
  Disconnected = "disconnected",
  Message = "message",
  Error = "error",
}

export type EventSourceMessage<T> =
  | { type: EventSourceMessageType.Connecting }
  | { type: EventSourceMessageType.Connected }
  | { type: EventSourceMessageType.Disconnected }
  | { type: EventSourceMessageType.Error }
  | { type: EventSourceMessageType.Message; data: T };

export function useJsonEventSource<T>(url: string) {
  const [messages, setMessages] = useState<EventSourceMessage<T>[]>([]);

  useEffect(() => {
    let es: EventSource;
    let reconnectHandle: NodeJS.Timeout;

    const connectToEventSource = () => {
      es = new EventSource(url);

      setMessages((prevMessages) => [
        ...prevMessages,
        { type: EventSourceMessageType.Connecting },
      ]);

      es.onopen = () => {
        clearTimeout(reconnectHandle);
        setMessages((prevMessages) => [
          ...prevMessages,
          { type: EventSourceMessageType.Connected },
        ]);
      };

      es.onmessage = (event) => {
        const newMessage: EventSourceMessage<T> = {
          type: EventSourceMessageType.Message,
          data: JSON.parse(event.data) as T,
        };
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      };

      es.onerror = () => {
        setMessages((prevMessages) => [
          ...prevMessages,
          { type: EventSourceMessageType.Error },
        ]);
        reconnectHandle = setTimeout(
          connectToEventSource,
          EVENTSOURCE_RECONNECT_TIMEOUT
        );
      };
    };

    connectToEventSource();

    // Close the connection when the component is unmounted
    return () => {
      es.close();
    };
  }, [url]);

  return messages;
}
