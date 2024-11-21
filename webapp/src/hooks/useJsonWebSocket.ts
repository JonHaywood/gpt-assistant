import { useEffect, useState } from "react";

export enum WebSocketMessageType {
  Connecting = "connecting",
  Connected = "connected",
  Disconnected = "disconnected",
  Message = "message",
  Error = "error",
}

export type WebSocketMessage<T> =
  | { type: WebSocketMessageType.Connecting }
  | { type: WebSocketMessageType.Connected }
  | { type: WebSocketMessageType.Disconnected }
  | { type: WebSocketMessageType.Error }
  | { type: WebSocketMessageType.Message; data: T };

/**
 * Hook that connects to a WebSocket server and returns the messages received,
 * parsed as JSON of type parameter `T`.
 */
export function useJsonWebSocket<T>(url: string) {
  const [messages, setMessages] = useState<WebSocketMessage<T>[]>([
    { type: WebSocketMessageType.Connecting },
  ]);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { type: WebSocketMessageType.Connected },
      ]);
    };

    ws.onmessage = (event) => {
      const newMessages: WebSocketMessage<T>[] = event.data
        .split("\n")
        .filter((line: string) => line.trim() !== "")
        .map((line: string) => {
          return {
            type: WebSocketMessageType.Message,
            data: JSON.parse(line) as T,
          };
        });
      setMessages((prevMessages) => [...prevMessages, ...newMessages]);
    };

    ws.onerror = () => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { type: WebSocketMessageType.Error },
      ]);
    };

    ws.onclose = () => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { type: WebSocketMessageType.Disconnected },
      ]);
    };

    // Close the WebSocket connection when the component is unmounted
    return () => {
      ws.close();
    };
  }, [url]);

  return messages;
}
