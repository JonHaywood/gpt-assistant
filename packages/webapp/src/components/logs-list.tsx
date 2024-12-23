"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  EventSourceMessage,
  EventSourceMessageType,
  useJsonEventSource,
} from "@/hooks/useJsonEventSource";
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

function StatusLog({ log }: { log: EventSourceMessage<Log> }) {
  let className = "text-green-400";
  if (log.type === EventSourceMessageType.Error) className = "text-red-400";
  else if (log.type === EventSourceMessageType.Reconnecting)
    className = "text-yellow-400";

  return (
    <span className="font-semibold">
      <span className={className}>{">"}</span>{" "}
      {log.type === EventSourceMessageType.Error &&
        "Error connecting to assistant logs"}
      {log.type === EventSourceMessageType.Connecting &&
        "Connecting to assistant logs..."}
      {log.type === EventSourceMessageType.Connected &&
        "Connected to assistant logs!"}
      {log.type === EventSourceMessageType.Disconnected &&
        "Connection to assistant logs was closed."}
      {log.type === EventSourceMessageType.Reconnecting && (
        <>
          Disconnected from assistant logs.
          <br />
          <span className="font-normal">Attempting to reconnect...</span>
        </>
      )}
    </span>
  );
}

export default function LogsList({ url }: { url: string }) {
  const lastDivRef = useRef<HTMLDivElement>(null);

  const logs = useJsonEventSource<Log>(url);

  // any time logs change, scroll to the bottom
  useEffect(() => {
    lastDivRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <ScrollArea className="h-[calc(100vh-10rem)] w-full text-xs font-mono p-4 bg-gray-800 text-white rounded-md">
      {logs.map((log, index) => (
        <div key={index}>
          {log.type === EventSourceMessageType.Message ? (
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
