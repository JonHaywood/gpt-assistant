"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useJsonWebSocket,
  WebSocketMessage,
  WebSocketMessageType,
} from "@/hooks/useJsonWebSocket";
import { useEffect, useRef } from "react";

interface Log {
  time: number;
  level: number;
  pid: number;
  filename: string;
  msg: string;
}

type LogLevelConfig = {
  [key: number]: {
    color: string;
    text: string;
  };
};

const logLevelConfig: LogLevelConfig = {
  10: { color: "text-gray-400", text: "TRACE" },
  20: { color: "text-blue-300", text: "DEBUG" },
  30: { color: "text-lime-200", text: "INFO" },
  40: { color: "text-yellow-500", text: "WARN" },
  50: { color: "text-red-400", text: "ERROR" },
  60: { color: "text-rose-500", text: "FATAL" },
};

function formatDate(date: number) {
  return new Date(date).toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
}

function formatLogLevel(level: number) {
  return (
    <span className={logLevelConfig[level].color}>
      {logLevelConfig[level].text}
    </span>
  );
}

function formatFilename(filename: string) {
  return <span className="text-amber-200">{filename}</span>;
}

function StatusLog({ log }: { log: WebSocketMessage<Log> }) {
  const isError = log.type === WebSocketMessageType.Error;
  return (
    <span className="font-semibold">
      <span className={isError ? "text-red-400" : "text-green-400"}>{">"}</span>{" "}
      {log.type === WebSocketMessageType.Error &&
        "Error connecting to assistant"}
      {log.type === WebSocketMessageType.Connecting &&
        "Connecting to assistant..."}
      {log.type === WebSocketMessageType.Connected && "Connected to assistant!"}
      {log.type === WebSocketMessageType.Disconnected &&
        "Disconnected from assistant."}
    </span>
  );
}

export default function LogsList({ url }: { url: string }) {
  const lastDivRef = useRef<HTMLDivElement>(null);

  const logs = useJsonWebSocket<Log>(url);

  // any time logs change, scroll to the bottom
  useEffect(() => {
    lastDivRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <ScrollArea className="h-[calc(100vh-10rem)] text-xs font-mono p-4 bg-gray-800 text-white rounded-md">
      {logs.map((log, index) => (
        <div key={index}>
          {log.type === WebSocketMessageType.Message ? (
            <>
              [{formatDate(log.data.time)}] {formatLogLevel(log.data.level)} (
              {log.data.pid}): {formatFilename(log.data.filename)}:{" "}
              {log.data.msg}
            </>
          ) : (
            <StatusLog log={log} />
          )}
        </div>
      ))}
      <div ref={lastDivRef}></div>
    </ScrollArea>
  );
}
