"use client";

import LogsList from "@/components/logs-list";

let url = "";

if (typeof window !== "undefined") {
  // if address is not provided, assume service is on same machine and
  // use the current hostname
  const webSocketAddress =
    process.env.NEXT_PUBLIC_ASSISTANT_WEBSOCKET_ADDRESS ||
    window.location.hostname;
  const webSocketPort = process.env.NEXT_PUBLIC_ASSISTANT_WEBSOCKET_PORT;
  url = `ws://${webSocketAddress}:${webSocketPort}`;
}

export default function Page() {
  return (
    <div>
      <h1 className="font-semibold pb-2">Logs</h1>
      <LogsList url={url} />
    </div>
  );
}
