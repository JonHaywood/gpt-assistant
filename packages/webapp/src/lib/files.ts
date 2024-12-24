import { stat, open } from "fs/promises";

export async function readLastLines(
  filePath: string,
  numLines: number,
  newLineChar: string = "\n"
): Promise<string[]> {
  const lines: string[] = [];
  const bufferSize = 1024; // Size of each chunk to read
  const stats = await stat(filePath);
  let position = stats.size; // Start at the end of the file
  let leftover = "";

  const fileHandle = await open(filePath, "r");

  try {
    while (lines.length < numLines && position > 0) {
      const bytesToRead = Math.min(bufferSize, position);
      position -= bytesToRead;

      const buffer = Buffer.alloc(bytesToRead);
      await fileHandle.read(buffer, 0, bytesToRead, position);

      // Combine leftover from the previous read and current chunk
      const chunk = buffer.toString("utf-8") + leftover;
      const chunkLines = chunk.split(newLineChar);

      // Save any incomplete line at the start of the chunk for the next iteration
      leftover = chunkLines.shift() || "";

      // Add complete lines from the current chunk
      lines.unshift(...chunkLines);

      // Keep only the last `numLines` lines
      if (lines.length > numLines) {
        lines.splice(0, lines.length - numLines);
      }
    }

    // If there's leftover data from the very beginning of the file
    if (leftover && lines.length < numLines) {
      lines.unshift(leftover);
    }
  } finally {
    await fileHandle.close();
  }

  return lines;
}
