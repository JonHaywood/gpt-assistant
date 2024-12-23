import { NextRequest } from "next/server";
import { promisify } from "util";
import { exec } from "child_process";

const execPromise = promisify(exec);

function formatError(error: string) {
  return `An error occurred: ${error}`;
}

/**
 * API endpoint to shutdown or restart the assistant docker container.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ command: string }> }
) {
  const command = (await params).command;

  if (!["start", "stop", "restart"].includes(command))
    return new Response("Invalid command", { status: 400 });

  try {
    const { stderr } = await execPromise(
      `docker ${command} gpt-assistant_assistant`
    );

    if (stderr) return new Response(formatError(stderr), { status: 500 });

    return new Response(
      `${
        command.charAt(0).toUpperCase() + command.slice(1)
      } command completed successfully.`
    );
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error) {
      return new Response(formatError(error.message), { status: 500 });
    }
    return new Response(formatError(JSON.stringify(error)), { status: 500 });
  }
}
