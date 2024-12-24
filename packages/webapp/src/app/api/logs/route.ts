import { readLastLines } from "@/lib/files";
import { NextRequest, NextResponse } from "next/server";
import { Tail } from "tail";

const LOG_FILEPATH = process.cwd() + "/logs/current.log";
const MAX_LAST_LINES = 200;

interface Client {
  id: string;
  writer: WritableStreamDefaultWriter;
}

// keep a list of connected clients
const clients: Client[] = [];

// file watcher instance
let tailInstance: Tail | null = null;

/**
 * Broadcast a log line to all connected clients.
 */
function broadcastLogLine(line: string) {
  clients.forEach(async (client) => {
    try {
      await client.writer.write(`data: ${JSON.stringify({ line })}\n\n`);
    } catch (error) {
      console.error(
        `LOGS: Failed to send message to client ${client.id}:`,
        error
      );
    }
  });
}

/**
 * Send the last few lines of the log file to a new client.
 */
async function sendInitialLogLines(writer: WritableStreamDefaultWriter) {
  const lastLines = await readLastLines(LOG_FILEPATH, MAX_LAST_LINES);
  for (const line of lastLines) {
    if (line.trim() === "") continue;
    writer.write(`data: ${line}\n\n`);
  }
}

/**
 * Watch the log file for changes and broadcast them to all connected clients.
 */
function startWatchingLogFile() {
  if (tailInstance) return;

  tailInstance = new Tail(LOG_FILEPATH);

  tailInstance.on("line", broadcastLogLine);

  tailInstance.on("error", (error) => {
    console.error("LOGS: File watcher error:", error);
  });

  console.log("LOGS: Log File watcher started");
}

/**
 * Endpoint to stream logs to clients using Server-Sent Events.
 */
export async function GET(req: NextRequest) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  // assign a unique ID to the client
  const clientId = crypto.randomUUID();
  clients.push({ id: clientId, writer });
  console.log(`LOGS: Client ${clientId} connected to Logs SSE`);

  // handle client disconnect
  req.signal.addEventListener("abort", () => {
    console.log(`LOGS: Client ${clientId} disconnected`);

    // close the writer
    writer.close();

    // remove the client from the list
    const clientIndex = clients.findIndex((client) => client.id === clientId);
    if (clientIndex !== -1) {
      clients.splice(clientIndex, 1);
    }

    // if no clients are connected, stop the file watcher
    if (clients.length === 0 && tailInstance) {
      tailInstance.unwatch();
      tailInstance = null;
      console.log("LOGS: File watcher stopped");
    }
  });

  // let client know connection is successful even if no logs are available
  writer.write("event: connected\n\n");

  // send the last few lines of the log file on initial connection
  await sendInitialLogLines(writer);

  // initialize the file watcher if it's not already running
  startWatchingLogFile();

  // send SSE headers
  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
