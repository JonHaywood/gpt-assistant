"use client";

import { useEffect, useRef } from "react";
import { createVisualizationRenderer, Visualizer3D } from "./renderer";

export function Visualizer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentContainer = containerRef.current;
    let visualizer: Visualizer3D;

    if (currentContainer) {
      visualizer = createVisualizationRenderer(currentContainer);
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
        <div>Status: ⌛ waiting for speech...</div>
      </div>
      <div ref={containerRef} className="w-full flex flex-1" />
    </div>
  );
}
