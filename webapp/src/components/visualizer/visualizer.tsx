"use client";

import { useEffect, useRef } from "react";
import { createVisualizationRenderer, Visualizer3D } from "./renderer";
import { useState } from "react";

function getSseUrl() {
  // allow .env to override the default address
  const address =
    process.env.NEXT_PUBLIC_ASSISTANT_SSE_ADDRESS || window.location.hostname;
  const port = process.env.NEXT_PUBLIC_ASSISTANT_SSE_PORT;

  return `${window.location.protocol}//${address}:${port}`;
}

export function Visualizer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const currentContainer = containerRef.current;
    let visualizer: Visualizer3D;

    if (currentContainer) {
      visualizer = createVisualizationRenderer(
        currentContainer,
        getSseUrl(),
        setIsSpeaking
      );
      currentContainer.appendChild(visualizer.domElement);
    }

    // cleanup
    return () => {
      if (currentContainer) {
        currentContainer.removeChild(visualizer.domElement);
        visualizer.cleanup();
      }
    };
  }, []); // The effect runs only once when the component mounts

  return (
    <div className="w-full flex flex-1 flex-col p-4 bg-black rounded-lg relative">
      <div className="absolute top-0 left-0 right-0 z-10 p-4 font-mono text-white text-xs">
        <div className="font-semibold">Visualizer</div>
        <div>
          Status: {isSpeaking ? `🔊 speaking...` : `⌛ waiting for speech...`}
        </div>
      </div>
      <div ref={containerRef} className="w-full flex flex-1" />
    </div>
  );
}
